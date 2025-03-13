
import { RatingSlider } from "../RatingSlider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EffortStepProps {
  activity: any;
  onCompleted: () => void;
}

export const EffortStep = ({ activity, onCompleted }: EffortStepProps) => {
  const { toast } = useToast();

  const handleSubmit = async (rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('activity_efforts')
        .insert({
          user_id: user.id,
          activity_id: activity.id,
          perceived_effort: rating,
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-sensa-purple">Valoración de tu última actividad</h2>
      <p className="text-gray-700">
        Tu última actividad fue "{activity.name}", {activity.formattedDistance} km 
        el {activity.formattedDate}. En una escala del 1 al 10, donde 1 es un 
        paseo suave y 10 el máximo esfuerzo posible, ¿podrías decirnos cuánto 
        fue el esfuerzo percibido durante esta sesión?
      </p>
      <RatingSlider onSubmit={handleSubmit} />
    </div>
  );
};
