
import { useState } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './ui/use-toast';

interface RecommendationFeedbackProps {
  onFeedbackProvided: () => void;
}

export const RecommendationFeedback = ({ onFeedbackProvided }: RecommendationFeedbackProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();

  const handleFeedback = async (feedback: string) => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { error } = await supabase
        .from('training_recommendations')
        .update({ 
          feedback,
          feedback_provided_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (error) throw error;

      toast({
        title: "¡Gracias por tu feedback!",
        description: "Tu opinión nos ayuda a mejorar las recomendaciones.",
      });

      setIsVisible(false);
      onFeedbackProvided();
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu feedback. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="mt-8 px-2 sm:px-4 space-y-4">
      <p className="text-lg font-medium text-center text-gray-700">
        ¿Qué te ha parecido mi recomendación de hoy?
      </p>
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => handleFeedback('like')}
          disabled={isSubmitting}
          variant="outline"
          className="text-base sm:text-lg py-3 hover:bg-green-50 min-h-[3rem]"
        >
          😄 ¡Me gusta! Voy a hacer el entrenamiento
        </Button>
        <Button
          onClick={() => handleFeedback('alternative')}
          disabled={isSubmitting}
          variant="outline"
          className="text-base sm:text-lg py-3 hover:bg-yellow-50 min-h-[3rem]"
        >
          😏 Creo que me convence más la sesión alternativa
        </Button>
        <Button
          onClick={() => handleFeedback('dislike')}
          disabled={isSubmitting}
          variant="outline"
          className="text-base sm:text-lg py-3 hover:bg-red-50 min-h-[3rem]"
        >
          🙄 No creo que ninguna se adapte a lo que necesito...
        </Button>
      </div>
    </div>
  );
};

