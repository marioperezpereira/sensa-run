
import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import CustomDatePicker from "@/components/personal-bests/CustomDatePicker";
import { Calendar } from "@/components/ui/calendar";

interface RaceDateStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const RaceDateStep = ({ value, onChange }: RaceDateStepProps) => {
  // Set default date to tomorrow
  useEffect(() => {
    if (!value) {
      const tomorrow = addDays(new Date(), 1);
      onChange(tomorrow.toISOString());
    }
  }, [value, onChange]);
  
  const handleDateSelect = (selectedDate: Date) => {
    onChange(selectedDate.toISOString());
  };
  
  // Convert string date to Date object if it exists
  const dateValue = value ? new Date(value) : undefined;
  
  // Function to disable past dates
  const isDateDisabled = (date: Date) => {
    return date < new Date(new Date().setHours(0, 0, 0, 0));
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
            {value ? format(new Date(value), "PPP") : "Selecciona una fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            initialFocus
            fromMonth={new Date()}
            showOutsideDays={false}
            captionLayout="buttons-only"
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
