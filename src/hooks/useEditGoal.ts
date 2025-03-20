
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { raceOptions } from "@/components/onboarding/types";
import { addDays } from "date-fns";

type RaceDistance = typeof raceOptions[number];

interface UseEditGoalProps {
  userId: string | undefined;
  currentGoalType: string;
  currentRaceDistance?: string;
  currentRaceDate?: string;
  onClose: () => void;
}

export function useEditGoal({
  userId,
  currentGoalType,
  currentRaceDistance,
  currentRaceDate,
  onClose
}: UseEditGoalProps) {
  const [goalType, setGoalType] = useState(currentGoalType);
  const [raceDistance, setRaceDistance] = useState<RaceDistance | undefined>(
    currentRaceDistance as RaceDistance | undefined
  );
  const [raceDate, setRaceDate] = useState<string | undefined>(currentRaceDate);
  const [step, setStep] = useState<"goal" | "race-target" | "race-date">("goal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set default date to tomorrow if needed
  useEffect(() => {
    if (goalType === "Quiero preparar una carrera lo mejor posible" && !raceDate) {
      const tomorrow = addDays(new Date(), 1);
      setRaceDate(tomorrow.toISOString());
    }
  }, [goalType, raceDate]);

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
      // Ensure date is in the future
      return raceDate !== undefined && new Date(raceDate) > new Date();
    }
    return false;
  };

  const handleRaceDistanceChange = (value: string) => {
    // Ensure we only set valid enum values that match our RaceDistance type
    if (raceOptions.includes(value as RaceDistance)) {
      setRaceDistance(value as RaceDistance);
    }
  };

  const handleRaceDateChange = (value: string) => setRaceDate(value);

  return {
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
  };
}
