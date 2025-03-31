
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { raceTypeOptions, getDistancesByRaceType } from "./types";

interface RaceTargetStepProps {
  value?: string;
  onChange: (value: string) => void;
  raceType?: string;
  onRaceTypeChange: (value: string) => void;
}

export const RaceTargetStep = ({ 
  value, 
  onChange, 
  raceType = "Asfalto", 
  onRaceTypeChange 
}: RaceTargetStepProps) => {
  const [availableDistances, setAvailableDistances] = useState<string[]>([]);

  useEffect(() => {
    setAvailableDistances(getDistancesByRaceType(raceType as any));
    // If the current selected distance is not available in the new race type,
    // clear the selection
    if (value && !getDistancesByRaceType(raceType as any).includes(value)) {
      onChange("");
    }
  }, [raceType, onChange, value]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Tipo de carrera</label>
        <Select 
          value={raceType} 
          onValueChange={onRaceTypeChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona el tipo de carrera" />
          </SelectTrigger>
          <SelectContent>
            {raceTypeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-gray-800 text-sm md:text-base">
          ¿Cuál es tu próximo objetivo?
        </p>
        <Select
          value={value}
          onValueChange={onChange}
          disabled={availableDistances.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona la distancia" />
          </SelectTrigger>
          <SelectContent>
            {availableDistances.map((distance) => (
              <SelectItem key={distance} value={distance}>
                {distance}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
