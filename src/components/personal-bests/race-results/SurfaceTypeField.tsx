
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { RaceFormValues, surfaceTypes } from "./types";

interface SurfaceTypeFieldProps {
  form: UseFormReturn<RaceFormValues>;
}

const SurfaceTypeField = ({ form }: SurfaceTypeFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="surfaceType"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>Tipo de superficie</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
              className="flex flex-col gap-2 sm:flex-row"
            >
              {surfaceTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`surface-${type}`} />
                  <FormLabel htmlFor={`surface-${type}`} className="font-normal">
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

export default SurfaceTypeField;
