import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type RatingStep = 'loading' | 'effort' | 'energy' | 'condition' | 'completed';

interface Activity {
  id: string;
  name: string;
  distance: number;
  start_date: string;
  moving_time: number;
  formattedDate?: string;
  formattedDistance?: string;
  strava_url?: string;
}

export const useRatingsFlow = () => {
  const [currentStep, setCurrentStep] = useState<RatingStep>('loading');
  const [activity, setActivity] = useState<Activity | null>(null);

  const checkLatestActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentStep('completed');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingRec } = await supabase
        .from('training_recommendations')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .maybeSingle();

      if (existingRec) {
        console.log('Already have recommendation, skipping activity check');
        setCurrentStep('completed');
        return;
      }

      const { data: stravaData, error: stravaError } = await supabase.functions.invoke(
        'fetch-strava-activities',
        {
          body: { user_id: user.id }
        }
      );

      if (stravaError || !stravaData?.activities?.length) {
        console.log('No recent activities found or error fetching them');
        setCurrentStep('energy');
        return;
      }

      const latestActivity = stravaData.activities[0];
      setActivity({
        ...latestActivity,
        strava_url: `https://www.strava.com/activities/${latestActivity.id}`
      });
      setCurrentStep('effort');
    } catch (error) {
      console.error('Error in checkLatestActivity:', error);
      setCurrentStep('energy');
    }
  };

  useEffect(() => {
    checkLatestActivity();
  }, []);

  const moveToNextStep = () => {
    switch (currentStep) {
      case 'effort':
        setCurrentStep('energy');
        break;
      case 'energy':
        setCurrentStep('condition');
        break;
      case 'condition':
        setCurrentStep('completed');
        break;
      default:
        break;
    }
  };

  const formatActivity = () => {
    if (!activity) return null;
    const date = format(new Date(activity.start_date), "d 'de' MMMM", { locale: es });
    const distance = (activity.distance / 1000).toFixed(2);
    return {
      ...activity,
      formattedDate: date,
      formattedDistance: distance
    };
  };

  return {
    currentStep,
    activity: activity ? formatActivity() : null,
    moveToNextStep,
    reset: () => {
      setCurrentStep('loading');
      setActivity(null);
      checkLatestActivity();
    }
  };
};
