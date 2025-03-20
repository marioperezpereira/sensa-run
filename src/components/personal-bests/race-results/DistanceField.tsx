
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RaceFormValues } from "./types";

interface DistanceFieldProps {
  form: UseFormReturn<RaceFormValues>;
}

const DistanceField = ({ form }: DistanceFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="distance"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Distancia</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la distancia" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="5K">5K</SelectItem>
              <SelectItem value="10K">10K</SelectItem>
              <SelectItem value="Half Marathon">Media maratón</SelectItem>
              <SelectItem value="Marathon">Maratón</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DistanceField;
