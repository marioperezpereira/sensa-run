
import { useRatingsFlow } from "@/hooks/useRatingsFlow";
import { EffortRating } from "./EffortRating";
import { EnergyRating } from "./EnergyRating";
import { ConditionSelection } from "./ConditionSelection";
import { Card } from "./ui/card";
import { generateTrainingPrompt } from "@/utils/generateTrainingPrompt";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import { useToast } from "./ui/use-toast";

export const RatingFlow = () => {
  const { currentStep, activity, moveToNextStep } = useRatingsFlow();
  const [recommendation, setRecommendation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConditionComplete = async (condition: string) => {
    try {
      setIsLoading(true);
      setError(null);
      moveToNextStep();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user found');
      }

      // Get energy rating
      const { data: energyRating } = await supabase
        .from('daily_conditions')
        .select('energy_level')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let effortRating = null;
      if (activity?.id) {
        const { data: effortRatings } = await supabase
          .from('activity_efforts')
          .select('perceived_effort')
          .eq('activity_id', activity.id)
          .order('created_at', { ascending: false })
          .limit(1);

        effortRating = effortRatings?.[0];
      }

      const prompt = await generateTrainingPrompt(
        activity,
        effortRating?.perceived_effort,
        energyRating?.energy_level || 0,
        condition
      );

      console.log('Calling edge function with prompt:', prompt);
      const { data, error: fnError } = await supabase.functions.invoke(
        'generate-training-recommendation',
        {
          body: { prompt }
        }
      );

      if (fnError) throw fnError;
      if (!data?.recommendation) throw new Error('No recommendation received');

      setRecommendation(data.recommendation);
    } catch (error) {
      console.error('Error in handleConditionComplete:', error);
      setError('Lo siento, ha habido un error generando tu recomendación. Por favor, inténtalo de nuevo.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar la recomendación. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStep === 'loading') {
    return <div className="grid place-items-center h-full">Cargando...</div>;
  }

  if (currentStep === 'completed') {
    return (
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-none">
        {isLoading ? (
          <div className="text-center">
            Espera unos segundos, estoy generando tu recomendación para el día de hoy...
          </div>
        ) : error ? (
          <div className="text-center text-red-500">
            {error}
          </div>
        ) : recommendation ? (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h3: ({children}) => <h3 className="text-2xl font-bold mb-4 text-sensa-purple">{children}</h3>
              }}
            >
              {recommendation}
            </ReactMarkdown>
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4 bg-white/80 backdrop-blur-sm border-none">
      {currentStep === 'effort' && activity && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-sensa-purple">Valoración de tu última actividad</h2>
          <p className="text-gray-700">
            Tu última actividad fue "{activity.name}", {activity.formattedDistance} km 
            el {activity.formattedDate}. En una escala del 1 al 10, donde 1 es un 
            paseo suave y 10 el máximo esfuerzo posible, ¿podrías decirnos cuánto 
            fue el esfuerzo percibido durante esta sesión?
          </p>
          <EffortRating 
            activityId={activity.id}
            onRatingSubmitted={moveToNextStep}
          />
        </div>
      )}

      {currentStep === 'energy' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-sensa-purple">Nivel de energía</h2>
          <p className="text-gray-700">
            En una escala del 1 al 10, ¿cómo calificarías tu nivel de energía hoy?
            Donde 1 es completamente agotado y 10 es lleno de energía.
          </p>
          <EnergyRating onCompleted={moveToNextStep} />
        </div>
      )}

      {currentStep === 'condition' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-sensa-purple">Estado general</h2>
          <p className="text-gray-700">
            Por último, ¿hay alguna condición especial que quieras registrar sobre 
            cómo te sientes hoy?
          </p>
          <ConditionSelection onCompleted={handleConditionComplete} />
        </div>
      )}
    </Card>
  );
};
