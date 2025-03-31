
import { GoalStep } from "@/components/onboarding/GoalStep";
import { RaceTargetStep } from "@/components/onboarding/RaceTargetStep";
import { RaceDateStep } from "@/components/onboarding/RaceDateStep";

interface EditGoalContentProps {
  step: "goal" | "race-target" | "race-date";
  goalType: string;
  raceDistance?: string;
  raceDate?: string;
  raceType?: string;
  onGoalTypeChange: (value: string) => void;
  onRaceDistanceChange: (value: string) => void;
  onRaceDateChange: (value: string) => void;
  onRaceTypeChange: (value: string) => void;
}

const EditGoalContent = ({
  step,
  goalType,
  raceDistance,
  raceDate,
  raceType = "Asfalto",
  onGoalTypeChange,
  onRaceDistanceChange,
  onRaceDateChange,
  onRaceTypeChange
}: EditGoalContentProps) => {
  switch (step) {
    case "goal":
      return <GoalStep value={goalType} onChange={onGoalTypeChange} />;
    case "race-target":
      return <RaceTargetStep 
               value={raceDistance} 
               onChange={onRaceDistanceChange}
               raceType={raceType}
               onRaceTypeChange={onRaceTypeChange}
             />;
    case "race-date":
      return <RaceDateStep value={raceDate} onChange={onRaceDateChange} />;
    default:
      return null;
  }
};

export default EditGoalContent;
