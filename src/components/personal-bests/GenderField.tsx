
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";

interface GenderFieldProps {
  form: UseFormReturn<ProfileFormValues>;
}

const GenderField = ({ form }: GenderFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="gender"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Género</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu género" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Male">Masculino</SelectItem>
              <SelectItem value="Female">Femenino</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default GenderField;
