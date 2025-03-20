
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useEditGoal } from "@/hooks/useEditGoal";
import EditGoalContent from "./EditGoalContent";
import EditGoalFooter from "./EditGoalFooter";
import { raceOptions } from "@/components/onboarding/types";

type RaceDistance = typeof raceOptions[number];

interface EditGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  currentGoalType: string;
  currentRaceDistance?: string;
  currentRaceDate?: string;
}

const EditGoalDialog = ({
  isOpen,
  onClose,
  userId,
  currentGoalType,
  currentRaceDistance,
  currentRaceDate
}: EditGoalDialogProps) => {
  const {
    goalType,
    raceDistance,
    raceDate,
    step,
    isSubmitting,
    handleGoalTypeChange,
    handleNext,
    handleBack,
    handleRaceDistanceChange,
    handleRaceDateChange,
    canProceed
  } = useEditGoal({
    userId,
    currentGoalType,
    currentRaceDistance,
    currentRaceDate,
    onClose
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifica tu objetivo</DialogTitle>
          <DialogDescription>
            Actualiza tu próximo objetivo de entrenamiento
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <EditGoalContent
            step={step}
            goalType={goalType}
            raceDistance={raceDistance}
            raceDate={raceDate}
            onGoalTypeChange={handleGoalTypeChange}
            onRaceDistanceChange={handleRaceDistanceChange}
            onRaceDateChange={handleRaceDateChange}
          />
        </div>

        <EditGoalFooter
          step={step}
          isSubmitting={isSubmitting}
          canProceed={canProceed}
          onBack={handleBack}
          onNext={handleNext}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditGoalDialog;
