
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DPDay, useDatePicker } from "@rehookify/datepicker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface CalendarProps {
  mode?: "single" | "multiple" | "range";
  selected?: Date | Date[] | undefined;
  onSelect?: (dates: Date | Date[] | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  locale?: string;
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
  locale = "default",
  fromYear,
  toYear,
  defaultMonth,
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
  
  // Handle date selection
  const handleDateChange = React.useCallback(
    (newSelectedDates: Date[]) => {
      if (!onSelect) return;
      
      if (mode === "single") {
        onSelect(newSelectedDates[0]);
      } else {
        onSelect(newSelectedDates);
      }
    },
    [mode, onSelect]
  );

  // Create the date picker context
  const {
    data,
    propGetters
  } = useDatePicker({
    selectedDates,
    onDatesChange: (props) => handleDateChange(props.selectedDates),
    dates: {
      mode: mode === "single" ? "single" : mode === "range" ? "range" : "multiple",
    },
    calendar: {
      ...(fromYear && toYear ? { 
        min: new Date(fromYear, 0, 1),
        max: new Date(toYear, 11, 31) 
      } : {}),
    },
    locale: locale !== "default" ? locale : undefined,
  });

  // Current displayed calendar
  const calendar = data.calendars[0];

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
              {...propGetters.previousYearsButton()}
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
            className="bg-transparent border border-input rounded px-2 text-sm"
            value={calendar.month}
            onChange={(e) => {
              const monthIndex = Number(e.target.value);
              const newDate = new Date(calendar.year, monthIndex);
              propGetters.monthButton(newDate)?.onClick?.();
            }}
          >
            {data.months.map((monthName, idx) => (
              <option key={idx} value={idx}>
                {monthName}
              </option>
            ))}
          </select>
          
          <select
            className="bg-transparent border border-input rounded px-2 text-sm"
            value={calendar.year}
            onChange={(e) => {
              const year = Number(e.target.value);
              const newDate = new Date(year, calendar.month);
              propGetters.yearButton(newDate)?.onClick?.();
            }}
          >
            {data.years.map((year) => (
              <option key={year.toString()} value={year}>
                {year}
              </option>
            ))}
          </select>
          
          {captionLayout === "dropdown-buttons" && (
            <button
              {...propGetters.nextYearsButton()}
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
            onClick={() => {
              const newDate = new Date(calendar.year, calendar.month - 1);
              propGetters.monthButton(newDate)?.onClick?.();
            }}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </button>
          
          <div className="font-medium text-sm">
            {data.months[calendar.month]} {calendar.year}
          </div>
          
          <button
            onClick={() => {
              const newDate = new Date(calendar.year, calendar.month + 1);
              propGetters.monthButton(newDate)?.onClick?.();
            }}
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
    <div className={cn("p-3 space-y-4 pointer-events-auto", className)}>
      {renderHeader()}
      
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1">
          {data.weekDays.map((day) => (
            <div key={day} className="text-muted-foreground text-center text-xs">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendar.days.map((day: DPDay) => {
            const isOutsideDay = !day.inCurrentMonth;
            const isDisabled = isDateDisabled(day.$date) || day.disabled;
            
            // Skip outside days if they're not shown
            if (!showOutsideDays && isOutsideDay) {
              return <div key={`outside-${day.day}`} className="h-9 w-9"></div>;
            }
            
            return (
              <button
                key={`${day.day}-${day.$date.getMonth()}-${day.$date.getFullYear()}`}
                {...propGetters.dayButton(day)}
                disabled={isDisabled}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-9 w-9 p-0 font-normal text-sm",
                  isOutsideDay && "text-muted-foreground opacity-50",
                  day.selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  day.isToday && !day.selected && "bg-accent text-accent-foreground",
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
