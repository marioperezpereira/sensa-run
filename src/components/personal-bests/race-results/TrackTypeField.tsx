
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { RaceFormValues, trackTypes } from "./types";

interface TrackTypeFieldProps {
  form: UseFormReturn<RaceFormValues>;
}

const TrackTypeField = ({ form }: TrackTypeFieldProps) => {
  const surfaceType = form.watch("surfaceType");
  
  if (surfaceType !== "Pista de atletismo") {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="trackType"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>Tipo de pista</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
              className="flex flex-col gap-2 sm:flex-row"
            >
              {trackTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`track-${type}`} />
                  <FormLabel htmlFor={`track-${type}`} className="font-normal">
                    {type}
                  </FormLabel>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TrackTypeField;
