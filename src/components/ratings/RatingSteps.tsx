
import { RatingStep } from "@/hooks/useRatingsFlow";
import { EffortStep } from "./steps/EffortStep";
import { EnergyStep } from "./steps/EnergyStep";
import { ConditionStep } from "./steps/ConditionStep";
import { HomeScreen } from "./steps/HomeScreen";
import { LoadingSpinner } from "../LoadingSpinner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  const showDialog = true;
  
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
    <Dialog open={showDialog} modal={false}>
      <DialogContent className="bg-white shadow-lg rounded-xl max-w-md mx-auto p-6 sm:p-8 border-none">
        <DialogTitle className="sr-only">Información de entrenamiento</DialogTitle>
        {content()}
      </DialogContent>
    </Dialog>
  );
};
