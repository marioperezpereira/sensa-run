
import { useState } from "react";
import { RatingSlider } from "../RatingSlider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EffortStepProps {
  activity: any;
  onCompleted: () => void;
  onBack?: () => void; // Keep the prop for type compatibility
}

export const EffortStep = ({ activity, onCompleted, onBack }: EffortStepProps) => {
  const { toast } = useToast();
  const [hasSelected, setHasSelected] = useState(false);

  const handleSubmit = async (rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('daily_conditions')
        .insert({
          user_id: user.id,
          effort_level: rating, // Changed from energy_level to effort_level
        });

      if (error) throw error;

      toast({
        title: "¡Gracias!",
        description: "Tu valoración ha sido guardada.",
      });

      onCompleted();
    } catch (error) {
      console.error('Error saving effort rating:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu valoración. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleRatingChange = () => {
    setHasSelected(true);
  };

  return (
    <div className="space-y-4 relative">
      <h2 className="text-xl font-semibold text-sensa-purple text-center">Valoración de tu última actividad</h2>
      <p className="text-gray-700">
        Tu última actividad fue{" "}
        <a 
          href={activity.strava_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sensa-purple hover:text-sensa-purple/80 underline"
        >
          "{activity.name}"
        </a>
        , {activity.formattedDistance} km el {activity.formattedDate}. 
        ¿Podrías decirnos cuál fue tu esfuerzo percibido durante esta sesión?
      </p>
      <RatingSlider 
        onSubmit={handleSubmit} 
        context="effort" 
        defaultValue={1} 
        onRatingChange={handleRatingChange}
        showSubmitButton={hasSelected}
      />
    </div>
  );
};
