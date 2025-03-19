
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange("");
      return;
    }
    
    onChange(date.toISOString());
  };
  
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
            {value ? format(new Date(value), "PPP", { locale: es }) : "Selecciona una fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date()}
            initialFocus
            locale={es}
            fromMonth={new Date()}
            toYear={currentYear + 5}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
