
import { RatingStep } from "@/hooks/useRatingsFlow";
import { EffortStep } from "./steps/EffortStep";
import { EnergyStep } from "./steps/EnergyStep";
import { ConditionStep } from "./steps/ConditionStep";
import { HomeScreen } from "./steps/HomeScreen";
import { LoadingSpinner } from "../LoadingSpinner";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface RatingStepsProps {
  currentStep: RatingStep;
  activity: any;
  moveToNextStep: () => void;
  moveToPreviousStep: () => void;
  onConditionComplete: (condition: string) => void;
}

export const RatingSteps = ({
  currentStep,
  activity,
  moveToNextStep,
  moveToPreviousStep,
  onConditionComplete,
}: RatingStepsProps) => {
  // Show dialog for all steps, including loading
  const showContent = true;
  
  const content = () => {
    if (currentStep === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingSpinner />
          <p className="mt-4 text-sensa-purple">Buscando tus actividades recientes...</p>
        </div>
      );
    }

    if (currentStep === 'home') {
      return <HomeScreen onContinue={moveToNextStep} />;
    }

    if (currentStep === 'effort' && activity) {
      return <EffortStep 
        activity={activity} 
        onCompleted={moveToNextStep} 
        onBack={moveToPreviousStep}
      />;
    }

    if (currentStep === 'energy') {
      return <EnergyStep 
        onCompleted={moveToNextStep} 
        onBack={moveToPreviousStep}
      />;
    }

    if (currentStep === 'condition') {
      return <ConditionStep 
        onCompleted={onConditionComplete} 
        onBack={moveToPreviousStep}
      />;
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
      <Card className="bg-white shadow-lg rounded-xl max-w-md mx-auto border-none">
        <CardContent className="p-6 sm:p-8">
          <CardTitle className="sr-only">Información de entrenamiento</CardTitle>
          {content()}
        </CardContent>
      </Card>
    </div>
  );
};
