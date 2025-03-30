
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  content: string;
  isBot: boolean;
  timestamp: string;
  activityId?: string;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastActivityChecked, setLastActivityChecked] = useState<string | null>(null);

  const checkRecentActivities = async () => {
    setIsTyping(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: activities, error } = await supabase.functions.invoke('fetch-strava-activities', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (activities?.activities && activities.activities.length > 0) {
        const activity = activities.activities[0];
        
        // Skip if we've already asked about this activity
        if (activity.id === lastActivityChecked) {
          return;
        }

        const date = format(new Date(activity.start_date), "d 'de' MMMM", { locale: es });
        const distance = (activity.distance / 1000).toFixed(2);
        
        const newMessage = {
          content: `¡Hola! Tu última actividad según Strava fue "${activity.name}", ${distance} km el ${date}. ¿Podrías decirnos cuánto fue tu esfuerzo percibido durante esta sesión?`,
          isBot: true,
          timestamp: new Date().toLocaleTimeString(),
          activityId: activity.id
        };

        await supabase
          .from('chat_messages')
          .insert({
            content: newMessage.content,
            is_bot: true,
            user_id: user.id,
            activity_id: activity.id
          });

        setLastActivityChecked(activity.id);
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    isTyping,
    checkRecentActivities,
  };
};
