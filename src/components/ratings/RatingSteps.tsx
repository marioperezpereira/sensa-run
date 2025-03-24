
import { RatingStep } from "@/hooks/useRatingsFlow";
import { EffortStep } from "./steps/EffortStep";
import { EnergyStep } from "./steps/EnergyStep";
import { ConditionStep } from "./steps/ConditionStep";
import { HomeScreen } from "./steps/HomeScreen";
import { LoadingSpinner } from "../LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";

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
  // Show content for all steps, including loading
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
    <>
      {/* Dark overlay behind the card */}
      <div className="fixed inset-0 bg-black/80 z-[49]" />
      
      <div className="fixed inset-0 flex items-center justify-center z-[50]">
        <Card className="bg-white shadow-lg rounded-xl max-w-md mx-auto p-6 sm:p-8 border-none">
          <CardContent className="p-0">
            <h2 className="sr-only">Información de entrenamiento</h2>
            {content()}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
