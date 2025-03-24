
import { useRatingsFlow } from "@/hooks/useRatingsFlow";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateTrainingPrompt } from "@/utils/generateTrainingPrompt";
import { useToast } from "./ui/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import { RecommendationDisplay } from "./recommendations/RecommendationDisplay";
import { RatingSteps } from "./ratings/RatingSteps";
import { Dialog, DialogContent } from "./ui/dialog";

export const RatingFlow = () => {
  const { currentStep, activity, moveToNextStep, moveToPreviousStep } = useRatingsFlow();
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
          setTimeout(() => {
            moveToNextStep(); // Skip home step
            moveToNextStep(); // Skip effort step
            moveToNextStep(); // Skip energy step
            moveToNextStep(); // Skip condition step
          }, 0);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking existing recommendation:', error);
        setError('Error loading recommendation. Please try again.');
        setIsLoading(false);
      }
    };

    checkExistingRecommendation();
  }, []);

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

      // Now we get the effort value from the same daily_conditions table
      let effortRating = null;
      if (activity?.id) {
        const { data: latestCondition } = await supabase
          .from('daily_conditions')
          .select('energy_level')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        effortRating = latestCondition;
      }

      const prompt = await generateTrainingPrompt(
        activity,
        effortRating?.energy_level,
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
      <Dialog open={true} modal={false}>
        <DialogContent className="bg-white shadow-lg rounded-xl max-w-2xl mx-auto p-6 border-none">
          <RecommendationDisplay 
            recommendation={recommendation}
            showFeedback={showFeedback}
            error={error}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <RatingSteps 
      currentStep={currentStep}
      activity={activity}
      moveToNextStep={moveToNextStep}
      moveToPreviousStep={moveToPreviousStep}
      onConditionComplete={handleConditionComplete}
    />
  );
};
