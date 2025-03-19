
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import CustomDatePicker from "@/components/personal-bests/CustomDatePicker";

interface RaceDateStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const RaceDateStep = ({ value, onChange }: RaceDateStepProps) => {
  const handleDateSelect = (selectedDate: Date) => {
    onChange(selectedDate.toISOString());
  };
  
  // Convert string date to Date object if it exists
  const dateValue = value ? new Date(value) : undefined;
  
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
          <CustomDatePicker
            value={dateValue}
            onChange={handleDateSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
