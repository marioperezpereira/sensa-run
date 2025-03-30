
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { RaceFormValues, trackDistances } from "./types";

interface DistanceFieldProps {
  form: UseFormReturn<RaceFormValues>;
}

const DistanceField = ({ form }: DistanceFieldProps) => {
  const surfaceType = form.watch("surfaceType");
  const trackType = form.watch("trackType");

  // Get the appropriate distances based on the surface type and track type
  let availableDistances: string[] = [];
  
  if (surfaceType === "Asfalto") {
    availableDistances = ["5K", "10K", "Half Marathon", "Marathon"];
  } else if (surfaceType === "Pista de atletismo" && trackType) {
    availableDistances = trackDistances[trackType] || [];
  }

  return (
    <FormField
      control={form.control}
      name="distance"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Distancia</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
            disabled={surfaceType === "Pista de atletismo" && !trackType}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la distancia" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableDistances.map((distance) => (
                <SelectItem key={distance} value={distance}>
                  {distance}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DistanceField;
