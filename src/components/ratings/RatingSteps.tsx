
import { Card } from "../ui/card";
import { EffortStep } from "./steps/EffortStep";
import { EnergyStep } from "./steps/EnergyStep";
import { ConditionStep } from "./steps/ConditionStep";
import type { RatingStep } from "@/hooks/useRatingsFlow";

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
  onConditionComplete
}: RatingStepsProps) => {
  return (
    <Card className="p-6 space-y-4 bg-white/80 backdrop-blur-sm border-none">
      {currentStep === 'effort' && activity && (
        <EffortStep 
          activity={activity} 
          onCompleted={moveToNextStep} 
        />
      )}

      {currentStep === 'energy' && (
        <EnergyStep 
          onCompleted={moveToNextStep} 
        />
      )}

      {currentStep === 'condition' && (
        <ConditionStep 
          onCompleted={onConditionComplete} 
        />
      )}
    </Card>
  );
};
