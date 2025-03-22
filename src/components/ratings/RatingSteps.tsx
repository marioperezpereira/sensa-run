
import { RatingStep } from "@/hooks/useRatingsFlow";
import { EffortStep } from "./steps/EffortStep";
import { EnergyStep } from "./steps/EnergyStep";
import { ConditionStep } from "./steps/ConditionStep";
import { HomeScreen } from "./steps/HomeScreen";
import { LoadingSpinner } from "../LoadingSpinner";

interface RatingStepsProps {
  currentStep: RatingStep;
  activity: any;
  moveToNextStep: () => void;
  onConditionComplete: (condition: string) => void;
}

export const RatingSteps = ({
  currentStep,
  activity,
  moveToNextStep,
  onConditionComplete,
}: RatingStepsProps) => {
  if (currentStep === 'loading') {
    return <LoadingSpinner />;
  }

  if (currentStep === 'home') {
    return <HomeScreen onContinue={moveToNextStep} />;
  }

  if (currentStep === 'effort' && activity) {
    return <EffortStep activity={activity} onComplete={moveToNextStep} />;
  }

  if (currentStep === 'energy') {
    return <EnergyStep onComplete={moveToNextStep} />;
  }

  if (currentStep === 'condition') {
    return <ConditionStep onComplete={onConditionComplete} />;
  }

  return null;
};
