
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UseFormReturn } from "react-hook-form";
import { RaceFormValues } from "./types";

interface RaceDateFieldProps {
  form: UseFormReturn<RaceFormValues>;
}

const RaceDateField = ({ form }: RaceDateFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="raceDate"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Fecha de la carrera</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={`w-full pl-3 text-left font-normal ${
                    !field.value && "text-muted-foreground"
                  }`}
                >
                  {field.value ? (
                    format(field.value, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) =>
                  date > new Date()
                }
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default RaceDateField;
