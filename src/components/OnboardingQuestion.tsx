
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ExperienceStep } from "./onboarding/ExperienceStep";
import { FrequencyStep } from "./onboarding/FrequencyStep";
import { GoalStep } from "./onboarding/GoalStep";
import { RaceTargetStep } from "./onboarding/RaceTargetStep";
import { RaceDateStep } from "./onboarding/RaceDateStep";
import { AdditionalInfoStep } from "./onboarding/AdditionalInfoStep";
import { StravaStep } from "./onboarding/StravaStep";
import { useOnboarding } from "@/hooks/useOnboarding";

interface OnboardingQuestionProps {
  onComplete: () => void;
}

export const OnboardingQuestion = ({ onComplete }: OnboardingQuestionProps) => {
  const {
    currentStep,
    formData,
    isSubmitting,
    handleInputChange,
    handleNext,
    canProceed,
  } = useOnboarding(onComplete);

  const renderStep = () => {
    switch (currentStep) {
      case "experience":
        return (
          <ExperienceStep
            value={formData.running_experience}
            onChange={(value) => handleInputChange("running_experience", value)}
          />
        );
      case "frequency":
        return (
          <FrequencyStep
            value={formData.weekly_frequency}
            onChange={(value) => handleInputChange("weekly_frequency", value)}
          />
        );
      case "goal":
        return (
          <GoalStep
            value={formData.goal_type}
            onChange={(value) => handleInputChange("goal_type", value)}
          />
        );
      case "race-target":
        return (
          <RaceTargetStep
            value={formData.race_distance}
            onChange={(value) => handleInputChange("race_distance", value)}
            raceType={formData.race_type}
            onRaceTypeChange={(value) => handleInputChange("race_type", value)}
          />
        );
      case "race-date":
        return (
          <RaceDateStep
            value={formData.race_date}
            onChange={(value) => handleInputChange("race_date", value)}
          />
        );
      case "additional-info":
        return (
          <AdditionalInfoStep
            value={formData.additional_info || ""}
            onChange={(value) => handleInputChange("additional_info", value)}
          />
        );
      case "strava":
        return (
          <StravaStep
            onSkip={handleNext}
            onNext={handleNext}
          />
        );
    }
  };

  return (
    <div className="flex flex-col space-y-6 animate-message-appear p-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        {renderStep()}
      </div>
      
      {currentStep !== "strava" && (
        <Button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="bg-sensa-purple hover:bg-sensa-purple/90 text-white rounded-[42px] py-4"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Continuar"
          )}
        </Button>
      )}
    </div>
  );
};
