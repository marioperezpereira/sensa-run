import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { experienceOptions } from "./types";

interface ExperienceStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const ExperienceStep = ({ value, onChange }: ExperienceStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-gray-800 text-sm md:text-base">
          ¡Hola! Soy Sensa, tu asistente para tus entrenamientos para correr día a día, 
          basado en tus sensaciones y objetivos. Como aún no nos conocemos, me gustaría 
          hacerte unas preguntas para personalizar la experiencia.
        </p>
        <p className="text-gray-800 text-sm md:text-base">
          ¿Cuánto tiempo llevas corriendo de forma frecuente?
        </p>
      </div>

      <RadioGroup
        className="gap-3"
        value={value}
        onValueChange={onChange}
      >
        {experienceOptions.map((option) => (
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
