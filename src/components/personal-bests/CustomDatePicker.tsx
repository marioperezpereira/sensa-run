
import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface CustomDatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
}

const CustomDatePicker = ({ value, onChange }: CustomDatePickerProps) => {
  const [currentYear, setCurrentYear] = useState(value?.getFullYear() || new Date().getFullYear() - 30);
  const [currentMonth, setCurrentMonth] = useState(value?.getMonth() || new Date().getMonth());
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const previousMonthDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate();
  
  const prevMonthDays = Array.from({ length: previousMonthDays }, (_, i) => daysInPreviousMonth - previousMonthDays + i + 1);
  
  const monthNames = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), 'MMMM', { locale: es }));
  
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
    onChange(selectedDate);
    // Auto-close is handled by parent component
  };
  
  const today = new Date();
  const isDateSelected = (day: number) => {
    return value && 
      value.getDate() === day && 
      value.getMonth() === currentMonth && 
      value.getFullYear() === currentYear;
  };
  
  const isDateInRange = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date <= today && date >= new Date("1900-01-01");
  };
  
  return (
    <div className="p-3 bg-white">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevYears} className="h-7 w-7 p-0 absolute left-1">
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handlePrevYear} className="h-7 w-7 p-0 ml-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="mx-2 text-sm font-medium flex-1 text-center">{currentYear}</span>
        <Button variant="ghost" size="icon" onClick={handleNextYear} className="h-7 w-7 p-0 mr-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleNextYears} className="h-7 w-7 p-0 absolute right-1">
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7 p-0 absolute left-1">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium flex-1 text-center">{monthNames[currentMonth]}</span>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 p-0 absolute right-1">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mt-6">
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
            className={`h-8 w-8 p-0 text-xs ${!isDateInRange(day) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isDateInRange(day)}
            onClick={() => isDateInRange(day) && handleDateSelect(day)}
          >
            {day}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CustomDatePicker;
