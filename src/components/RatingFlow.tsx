import { useRatingsFlow } from "@/hooks/useRatingsFlow";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateTrainingPrompt } from "@/utils/generateTrainingPrompt";
import { useToast } from "./ui/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import { RecommendationDisplay } from "./recommendations/RecommendationDisplay";
import { RatingSteps } from "./ratings/RatingSteps";

export const RatingFlow = () => {
  const { currentStep, activity, moveToNextStep } = useRatingsFlow();
  const [recommendation, setRecommendation] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkExistingRecommendation = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: existingRec, error: recError } = await supabase
          .from('training_recommendations')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString())
          .maybeSingle();

        if (recError) throw recError;

        if (existingRec) {
          console.log('Found existing recommendation, showing it directly');
          setRecommendation(existingRec.recommendation);
          setShowFeedback(!existingRec.feedback);
          moveToNextStep(); // Move to energy step
          moveToNextStep(); // Move to condition step
          moveToNextStep(); // Move to completed step
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking existing recommendation:', error);
        setError('Error loading recommendation. Please try again.');
        setIsLoading(false);
      }
    };

    checkExistingRecommendation();
  }, [moveToNextStep]);

  const handleConditionComplete = async (condition: string) => {
    try {
      setIsLoading(true);
      setError(null);
      moveToNextStep();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

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

      const { data, error: fnError } = await supabase.functions.invoke(
        'generate-training-recommendation',
        {
          body: { 
            prompt,
            userId: user.id
          }
        }
      );

      if (fnError) throw fnError;
      if (!data?.recommendation) throw new Error('No recommendation received');

      setRecommendation(data.recommendation);
      setShowFeedback(!data.hasFeedback);
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        {error}
      </div>
    );
  }

  if (currentStep === 'completed' && recommendation) {
    return (
      <RecommendationDisplay 
        recommendation={recommendation}
        showFeedback={showFeedback}
        error={error}
      />
    );
  }

  return (
    <RatingSteps 
      currentStep={currentStep}
      activity={activity}
      moveToNextStep={moveToNextStep}
      onConditionComplete={handleConditionComplete}
    />
  );
};
