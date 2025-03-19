
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface RaceDateStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const RaceDateStep = ({ value, onChange }: RaceDateStepProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="space-y-4">
      <p className="text-gray-800 text-sm md:text-base">
        ¿Qué fecha quieres correrla?
      </p>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(new Date(value), "PPP") : "Selecciona una fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => onChange(date?.toISOString() || "")}
            disabled={(date) => date < new Date()}
            initialFocus
            captionLayout="dropdown-buttons"
            fromYear={currentYear}
            toYear={currentYear + 5}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
