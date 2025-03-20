
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GoalStep } from "@/components/onboarding/GoalStep";
import { RaceTargetStep } from "@/components/onboarding/RaceTargetStep";
import { RaceDateStep } from "@/components/onboarding/RaceDateStep";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
  const [goalType, setGoalType] = useState(currentGoalType);
  const [raceDistance, setRaceDistance] = useState<RaceDistance | undefined>(
    currentRaceDistance as RaceDistance | undefined
  );
  const [raceDate, setRaceDate] = useState<string | undefined>(currentRaceDate);
  const [step, setStep] = useState<"goal" | "race-target" | "race-date">("goal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleGoalTypeChange = (value: string) => {
    setGoalType(value);
    // If no specific race is selected, skip the race-specific steps
    if (value !== "Quiero preparar una carrera lo mejor posible") {
      setRaceDistance(undefined);
      setRaceDate(undefined);
    }
  };

  const handleNext = () => {
    if (step === "goal") {
      if (goalType === "Quiero preparar una carrera lo mejor posible") {
        setStep("race-target");
      } else {
        handleSave();
      }
    } else if (step === "race-target") {
      setStep("race-date");
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step === "race-date") {
      setStep("race-target");
    } else if (step === "race-target") {
      setStep("goal");
    }
  };

  const handleSave = async () => {
    try {
      if (!userId) {
        toast({
          title: "Error",
          description: "Usuario no encontrado",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);

      const updateData: any = {
        goal_type: goalType,
      };

      // Only include race details if the goal type is race-specific
      if (goalType === "Quiero preparar una carrera lo mejor posible") {
        updateData.race_distance = raceDistance;
        updateData.race_date = raceDate;
      } else {
        // Clear race fields if goal type changed to non-race
        updateData.race_distance = null;
        updateData.race_date = null;
      }

      const { error } = await supabase
        .from('user_onboarding')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Objetivo actualizado",
        description: "Tu objetivo ha sido actualizado correctamente"
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['onboarding']
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el objetivo. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === "goal") {
      return goalType !== "";
    } else if (step === "race-target") {
      return raceDistance !== undefined;
    } else if (step === "race-date") {
      return raceDate !== undefined && new Date(raceDate) > new Date();
    }
    return false;
  };

  const renderStepContent = () => {
    switch (step) {
      case "goal":
        return <GoalStep value={goalType} onChange={handleGoalTypeChange} />;
      case "race-target":
        return <RaceTargetStep value={raceDistance} onChange={(value) => setRaceDistance(value)} />;
      case "race-date":
        return <RaceDateStep value={raceDate} onChange={(value) => setRaceDate(value)} />;
    }
  };

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
          {renderStepContent()}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
          {step !== "goal" && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Atrás
            </Button>
          )}
          
          <Button 
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="bg-sensa-purple hover:bg-sensa-purple/90 text-white w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step === "race-date" || (step === "goal" && goalType !== "Quiero preparar una carrera lo mejor posible") ? (
              "Guardar"
            ) : (
              "Continuar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditGoalDialog;
