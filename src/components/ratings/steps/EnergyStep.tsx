
import { RatingSlider } from "../RatingSlider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EnergyStepProps {
  onCompleted: () => void;
}

export const EnergyStep = ({ onCompleted }: EnergyStepProps) => {
  const { toast } = useToast();

  const handleSubmit = async (rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('daily_conditions')
        .insert({
          user_id: user.id,
          energy_level: rating,
        });

      if (error) throw error;

      toast({
        title: "¡Gracias!",
        description: "Tu nivel de energía ha sido guardado.",
      });

      onCompleted();
    } catch (error) {
      console.error('Error saving energy level:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu nivel de energía. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-sensa-purple">Nivel de energía</h2>
      <p className="text-gray-700">
        En una escala del 1 al 10, ¿cómo calificarías tu nivel de energía hoy?
        Donde 1 es completamente agotado y 10 es lleno de energía.
      </p>
      <RatingSlider onSubmit={handleSubmit} context="energy" />
    </div>
  );
};
