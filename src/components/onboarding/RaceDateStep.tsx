
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface RaceDateStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const RaceDateStep = ({ value, onChange }: RaceDateStepProps) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  
  // Generate days for the current month/year
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const previousMonthDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate();
  
  const prevMonthDays = Array.from({ length: previousMonthDays }, (_, i) => daysInPreviousMonth - previousMonthDays + i + 1);
  
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const handlePrevYear = () => setCurrentYear(currentYear - 1);
  const handleNextYear = () => setCurrentYear(currentYear + 1);
  const handlePrevYears = () => setCurrentYear(currentYear - 10);
  const handleNextYears = () => setCurrentYear(currentYear + 10);
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    onChange(selectedDate.toISOString());
  };
  
  const today = new Date();
  const isDateSelected = (day: number) => {
    if (!value) return false;
    const selectedDate = new Date(value);
    return selectedDate.getDate() === day && 
      selectedDate.getMonth() === currentMonth && 
      selectedDate.getFullYear() === currentYear;
  };
  
  const isDateInPast = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date < today;
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
          <div className="p-3 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handlePrevYears} className="h-7 w-7 p-0">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePrevYear} className="h-7 w-7 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="mx-2 text-sm font-medium">{currentYear}</span>
                <Button variant="ghost" size="icon" onClick={handleNextYear} className="h-7 w-7 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextYears} className="h-7 w-7 p-0">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{monthNames[currentMonth]}</span>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="h-8 w-8 flex items-center justify-center">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {prevMonthDays.map((day) => (
                <div 
                  key={`prev-${day}`} 
                  className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground opacity-50"
                >
                  {day}
                </div>
              ))}
              
              {days.map((day) => (
                <Button
                  key={day}
                  variant={isDateSelected(day) ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 p-0 text-xs ${isDateInPast(day) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDateInPast(day)}
                  onClick={() => !isDateInPast(day) && handleDateSelect(day)}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
