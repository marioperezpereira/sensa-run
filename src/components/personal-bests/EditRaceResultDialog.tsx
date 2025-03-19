
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";

interface RaceResult {
  id: string;
  race_date: string;
  distance: string;
  hours: number;
  minutes: number;
  seconds: number;
}

const formSchema = z.object({
  raceDate: z.date({
    required_error: "Selecciona la fecha de la carrera",
  }),
  hours: z.number().min(0).max(99),
  minutes: z.number().min(0).max(59),
  seconds: z.number().min(0).max(59),
}).refine(data => {
  // At least one time unit must be greater than 0
  return data.hours > 0 || data.minutes > 0 || data.seconds > 0;
}, {
  message: "Debes ingresar un tiempo válido",
  path: ["minutes"],
});

type RaceFormValues = z.infer<typeof formSchema>;

interface EditRaceResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: RaceResult;
  onResultUpdated: (updatedResult: RaceResult) => void;
}

const EditRaceResultDialog = ({ 
  open, 
  onOpenChange, 
  result, 
  onResultUpdated 
}: EditRaceResultDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<RaceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      raceDate: new Date(result.race_date),
      hours: result.hours,
      minutes: result.minutes,
      seconds: result.seconds,
    },
  });

  const onSubmit = async (values: RaceFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('race_results')
        .update({
          race_date: format(values.raceDate, 'yyyy-MM-dd'),
          hours: values.hours,
          minutes: values.minutes,
          seconds: values.seconds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', result.id);
      
      if (error) {
        console.error('Error updating race result:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el resultado",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Resultado actualizado",
        description: "El resultado ha sido actualizado correctamente",
      });
      
      // Return updated result
      const updatedResult: RaceResult = {
        ...result,
        race_date: format(values.raceDate, 'yyyy-MM-dd'),
        hours: values.hours,
        minutes: values.minutes,
        seconds: values.seconds,
      };
      
      onResultUpdated(updatedResult);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar resultado: {result.distance}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date()
                        }
                        initialFocus
                        locale={es}
                        captionLayout="dropdown-buttons"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Actualizar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRaceResultDialog;
