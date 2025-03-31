
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { OnboardingStep, OnboardingData } from "@/components/onboarding/types";

export const useOnboarding = (onComplete: () => void) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("experience");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    running_experience: "",
    weekly_frequency: "",
    goal_type: "",
    race_distance: undefined,
    race_date: undefined,
    additional_info: "",
    strava_profile: "",
    race_type: "Asfalto", // Default race type
  });

  const handleInputChange = (key: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateStravaUrl = (url: string) => {
    return url.startsWith('https://www.strava.com/') || url.startsWith('https://strava.com/');
  };

  const saveOnboardingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Check if onboarding data already exists
      const { data: existingData } = await supabase
        .from('user_onboarding')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // We no longer need to type cast race_distance since the schema now accepts any string
      const dataToSave = {
        running_experience: formData.running_experience,
        weekly_frequency: formData.weekly_frequency,
        goal_type: formData.goal_type,
        race_distance: formData.race_distance,
        race_date: formData.race_date,
        additional_info: formData.additional_info,
        race_type: formData.race_type, 
      };

      if (existingData) {
        const { error } = await supabase
          .from('user_onboarding')
          .update(dataToSave)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_onboarding')
          .insert({
            user_id: user.id,
            ...dataToSave
          });

        if (error) throw error;
      }
      
      return user.id;
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      throw error;
    }
  };

  const handleNext = async () => {
    const steps: { [key in OnboardingStep]: OnboardingStep | undefined } = {
      "experience": "frequency",
      "frequency": "goal",
      "goal": formData.goal_type === "Quiero preparar una carrera lo mejor posible" ? "race-target" : "strava",
      "race-target": "race-date",
      "race-date": "strava",
      "additional-info": "strava",
      "strava": undefined
    };

    // If we're moving to the Strava step, save the data first
    if (steps[currentStep] === "strava") {
      setIsSubmitting(true);
      try {
        await saveOnboardingData();
        setCurrentStep("strava");
      } catch (error: any) {
        console.error('Error in handleNext:', error);
        toast({
          title: "Error",
          description: "No se pudieron guardar tus respuestas. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // If we're at the Strava step, complete the onboarding
    if (currentStep === "strava") {
      onComplete();
      return;
    }

    setCurrentStep(steps[currentStep] || "experience");
  };

  const canProceed = () => {
    switch (currentStep) {
      case "experience":
        return formData.running_experience !== "";
      case "frequency":
        return formData.weekly_frequency !== "";
      case "goal":
        return formData.goal_type !== "";
      case "race-target":
        return formData.race_distance !== undefined && formData.race_type !== undefined;
      case "race-date":
        return formData.race_date !== undefined && new Date(formData.race_date) > new Date();
      case "additional-info":
        return true;
      case "strava":
        return formData.strava_profile === "" || validateStravaUrl(formData.strava_profile);
      default:
        return false;
    }
  };

  return {
    currentStep,
    formData,
    isSubmitting,
    handleInputChange,
    handleNext,
    canProceed,
  };
};
