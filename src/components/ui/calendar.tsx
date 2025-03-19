
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDatePicker } from "@rehookify/datepicker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface CalendarProps {
  mode?: "single" | "multiple" | "range";
  selected?: Date | Date[] | undefined;
  onSelect?: (dates: Date | Date[] | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  locale?: Locale;
  fromYear?: number;
  toYear?: number;
  defaultMonth?: Date;
  initialFocus?: boolean;
  showOutsideDays?: boolean;
  captionLayout?: "buttons" | "dropdown" | "dropdown-buttons";
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
  locale,
  fromYear,
  toYear,
  defaultMonth,
  initialFocus,
  showOutsideDays = true,
  captionLayout = "buttons",
}: CalendarProps) {
  // Convert selected to array for internal use
  const selectedDates = React.useMemo(() => {
    if (!selected) return [];
    return Array.isArray(selected) ? selected : [selected];
  }, [selected]);

  // Initialize with the provided defaultMonth or first selected date or current date
  const initialMonth = defaultMonth || (selectedDates[0] || new Date());

  const {
    data: {
      weekDays,
      monthDays,
      month,
      year,
      years,
      months,
    },
    propGetters: {
      dayButton,
      nextMonthButton,
      previousMonthButton,
      nextYearButton,
      previousYearButton,
      yearSelect,
      monthSelect,
    },
    actions: {
      setMonth,
      setYear,
    },
  } = useDatePicker({
    selectedDates,
    onDatesChange: (dates) => {
      if (!onSelect) return;
      if (mode === "single") {
        onSelect(dates[0]);
      } else if (mode === "multiple") {
        onSelect(dates);
      } else if (mode === "range") {
        onSelect(dates);
      }
    },
    defaultMonth: initialMonth.getMonth(),
    defaultYear: initialMonth.getFullYear(),
    fromYear: fromYear || initialMonth.getFullYear() - 100,
    toYear: toYear || initialMonth.getFullYear() + 5,
    locale,
  });

  // Custom date disabler function
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      return disabled ? disabled(date) : false;
    },
    [disabled]
  );

  // Create a header with month and year selectors or buttons based on captionLayout
  const renderHeader = () => {
    if (captionLayout === "dropdown" || captionLayout === "dropdown-buttons") {
      return (
        <div className="flex justify-center space-x-2 mb-2">
          {captionLayout === "dropdown-buttons" && (
            <button 
              {...previousYearButton()}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
              <span className="sr-only">Previous Year</span>
            </button>
          )}
          
          <select
            {...monthSelect()}
            className="bg-transparent border border-input rounded px-2 text-sm"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
          >
            {months.map((monthName, idx) => (
              <option key={monthName} value={idx}>
                {monthName}
              </option>
            ))}
          </select>
          
          <select
            {...yearSelect()}
            className="bg-transparent border border-input rounded px-2 text-sm"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          
          {captionLayout === "dropdown-buttons" && (
            <button 
              {...nextYearButton()}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              )}
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
              <span className="sr-only">Next Year</span>
            </button>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex justify-between items-center mb-2">
          <button 
            {...previousMonthButton()} 
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </button>
          
          <div className="font-medium text-sm">
            {months[month]} {year}
          </div>
          
          <button 
            {...nextMonthButton()}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </button>
        </div>
      );
    }
  };

  return (
    <div className={cn("p-3 space-y-4", className)}>
      {renderHeader()}
      
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="text-muted-foreground text-center text-xs">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, idx) => {
            const isOutsideDay = day.inCurrentMonth === false;
            const isDisabled = isDateDisabled(day.date);
            const isSelected = selectedDates.some(
              (selectedDate) => 
                selectedDate.getDate() === day.date.getDate() &&
                selectedDate.getMonth() === day.date.getMonth() &&
                selectedDate.getFullYear() === day.date.getFullYear()
            );
            const isToday = 
              day.date.getDate() === new Date().getDate() &&
              day.date.getMonth() === new Date().getMonth() &&
              day.date.getFullYear() === new Date().getFullYear();
            
            // Skip outside days if they're not shown
            if (!showOutsideDays && isOutsideDay) {
              return <div key={`outside-${idx}`} className="h-9 w-9"></div>;
            }
            
            return (
              <button
                key={`${day.day}-${day.monthIndex}-${idx}`}
                {...dayButton(day.date)}
                disabled={isDisabled}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-9 w-9 p-0 font-normal text-sm",
                  isOutsideDay && "text-muted-foreground opacity-50",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isToday && !isSelected && "bg-accent text-accent-foreground",
                  isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed"
                )}
              >
                {day.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
