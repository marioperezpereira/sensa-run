
import { RatingStep } from "@/hooks/useRatingsFlow";
import { EffortStep } from "./steps/EffortStep";
import { EnergyStep } from "./steps/EnergyStep";
import { ConditionStep } from "./steps/ConditionStep";
import { HomeScreen } from "./steps/HomeScreen";
import { LoadingSpinner } from "../LoadingSpinner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  // Display dialog only for non-loading steps
  const showDialog = currentStep !== 'loading';
  
  const content = () => {
    if (currentStep === 'loading') {
      return (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <LoadingSpinner />
            <p className="mt-4 text-sensa-purple">Buscando tus actividades recientes...</p>
          </div>
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

  // If it's the loading step, just show the spinner without the dialog
  if (currentStep === 'loading') {
    return content();
  }

  // For all other steps, show the dialog with appropriate content
  return (
    <Dialog open={showDialog} modal={false}>
      <DialogContent className="bg-white shadow-lg rounded-xl max-w-md mx-auto p-6 sm:p-8 border-none">
        {content()}
      </DialogContent>
    </Dialog>
  );
};
