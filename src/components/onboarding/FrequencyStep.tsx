
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { frequencyOptions } from "./types";

interface FrequencyStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const FrequencyStep = ({ value, onChange }: FrequencyStepProps) => {
  return (
    <div className="space-y-4">
      <p className="text-gray-800 text-sm md:text-base">
        ¿Cuántas veces sales a correr habitualmente cada semana?
      </p>
      <RadioGroup
        className="gap-3"
        value={value}
        onValueChange={onChange}
      >
        {frequencyOptions.map((option) => (
          <div key={option} className="flex items-center">
            <RadioGroupItem 
              value={option} 
              id={option}
              className="peer hidden"
            />
            <Label
              htmlFor={option}
              className={cn(
                "flex-1 cursor-pointer rounded-xl border border-gray-200 p-4",
                "hover:bg-gray-50 hover:border-gray-300",
                "peer-checked:border-telegram-blue peer-checked:bg-telegram-light",
                "transition-all duration-200",
                value === option && "font-bold"
              )}
            >
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
