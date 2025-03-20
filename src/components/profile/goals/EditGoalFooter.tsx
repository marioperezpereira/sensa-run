
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

interface EditGoalFooterProps {
  step: "goal" | "race-target" | "race-date";
  isSubmitting: boolean;
  canProceed: () => boolean;
  onBack: () => void;
  onNext: () => void;
}

const EditGoalFooter = ({
  step,
  isSubmitting,
  canProceed,
  onBack,
  onNext
}: EditGoalFooterProps) => {
  return (
    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
      {step !== "goal" && (
        <Button 
          variant="outline" 
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Atrás
        </Button>
      )}
      
      <Button 
        onClick={onNext}
        disabled={!canProceed() || isSubmitting}
        className="bg-sensa-purple hover:bg-sensa-purple/90 text-white w-full sm:w-auto"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : step === "race-date" || (step === "goal" && canProceed()) ? (
          "Guardar"
        ) : (
          "Continuar"
        )}
      </Button>
    </DialogFooter>
  );
};

export default EditGoalFooter;
