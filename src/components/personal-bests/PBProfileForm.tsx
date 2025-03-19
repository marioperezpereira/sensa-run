import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  gender: z.enum(["Male", "Female"], {
    required_error: "Debes seleccionar el género",
  }),
  dateOfBirth: z.date({
    required_error: "Debes seleccionar la fecha de nacimiento",
  }),
});

type ProfileFormValues = z.infer<typeof formSchema>;

interface PBProfileFormProps {
  onProfileSaved: () => void;
}

const PBProfileForm = ({ onProfileSaved }: PBProfileFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "No se pudo identificar al usuario",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase.from('user_pb_profiles').insert({
        user_id: user.id,
        gender: values.gender,
        date_of_birth: format(values.dateOfBirth, 'yyyy-MM-dd'),
      });
      
      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar el perfil",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Perfil guardado",
        description: "Tu perfil ha sido guardado correctamente",
      });
      
      onProfileSaved();
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar tus datos",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-medium">Información de perfil</h2>
        <p className="text-sm text-gray-500">
          Para calcular los puntos IAAF equivalentes de tus marcas necesitamos algunos datos adicionales.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de nacimiento</FormLabel>
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1940}
                      toYear={currentYear - 10}
                      showOutsideDays={false}
                      locale="es"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full bg-sensa-purple hover:bg-sensa-purple/90" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar información"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PBProfileForm;
