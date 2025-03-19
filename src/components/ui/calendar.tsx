
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useContextCalendars, useDatePickerContext } from "@rehookify/datepicker";
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
  
  // Create the date picker context
  const { propGetters, calendar } = useContextCalendars({
    selectedDates,
    onDatesChange: (dates) => {
      if (!onSelect) return;
      if (mode === "single") {
        onSelect(dates[0]);
      } else if (mode === "multiple" || mode === "range") {
        onSelect(dates);
      }
    },
    calendar: {
      month: initialMonth.getMonth(),
      year: initialMonth.getFullYear(),
      fromYear: fromYear || initialMonth.getFullYear() - 100,
      toYear: toYear || initialMonth.getFullYear() + 5,
    },
    locale: locale as any,
  });

  const { weekDays, months, years, calendarCells, navigation } = useDatePickerContext();

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
              {...propGetters.previousYear()}
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
            {...propGetters.monthSelect()}
            className="bg-transparent border border-input rounded px-2 text-sm"
            value={navigation.month}
          >
            {months.map((monthName, idx) => (
              <option key={monthName} value={idx}>
                {monthName}
              </option>
            ))}
          </select>
          
          <select
            {...propGetters.yearSelect()}
            className="bg-transparent border border-input rounded px-2 text-sm"
            value={navigation.year}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          
          {captionLayout === "dropdown-buttons" && (
            <button
              {...propGetters.nextYear()}
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
            {...propGetters.previousMonth()}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </button>
          
          <div className="font-medium text-sm">
            {months[navigation.month]} {navigation.year}
          </div>
          
          <button
            {...propGetters.nextMonth()}
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
          {weekDays.map((day) => (
            <div key={day} className="text-muted-foreground text-center text-xs">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((week, weekIndex) => (
            <React.Fragment key={`week-${weekIndex}`}>
              {week.map((day) => {
                const isOutsideDay = day.date.getMonth() !== navigation.month;
                const isDisabled = isDateDisabled(day.date);
                const isSelected = day.selected;
                const isToday = day.today;
                
                // Skip outside days if they're not shown
                if (!showOutsideDays && isOutsideDay) {
                  return <div key={`outside-${day.day}`} className="h-9 w-9"></div>;
                }
                
                return (
                  <button
                    key={`${day.day}-${day.date.getMonth()}-${day.date.getFullYear()}`}
                    {...propGetters.dayButton(day.date)}
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
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
