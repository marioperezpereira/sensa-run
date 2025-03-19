
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RaceFormValues } from "./types";

interface TimeFieldsProps {
  form: UseFormReturn<RaceFormValues>;
}

const TimeFields = ({ form }: TimeFieldsProps) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      <FormField
        control={form.control}
        name="hours"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Horas</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="99"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="minutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minutos</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="59"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="seconds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Segundos</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="59"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default TimeFields;
