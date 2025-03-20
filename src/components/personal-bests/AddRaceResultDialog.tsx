
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RaceFormSchema, RaceFormValues } from "./race-results/types";
import RaceDateField from "./race-results/RaceDateField";
import TimeFields from "./race-results/TimeFields";
import DistanceField from "./race-results/DistanceField";

interface AddRaceResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRaceAdded: () => void;
}

const AddRaceResultDialog = ({ open, onOpenChange, onRaceAdded }: AddRaceResultDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<RaceFormValues>({
    resolver: zodResolver(RaceFormSchema),
    defaultValues: {
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
  });

  const onSubmit = async (values: RaceFormValues) => {
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
      
      // Save race result
      const { error } = await saveRaceResult(user.id, values);
      
      if (error) {
        console.error('Error saving race result:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar el resultado",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Resultado guardado",
        description: "Tu marca ha sido guardada correctamente",
      });
      
      // Reset form
      form.reset({
        distance: undefined,
        raceDate: undefined,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
      
      onRaceAdded();
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

  // Helper function to save race result
  const saveRaceResult = async (userId: string, values: RaceFormValues) => {
    const { raceDate, distance, hours, minutes, seconds } = values;
    
    return await supabase.from('race_results').insert({
      user_id: userId,
      distance: distance,
      race_date: raceDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      hours,
      minutes,
      seconds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva marca personal</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <DistanceField form={form} />
            <RaceDateField form={form} />
            <TimeFields form={form} />
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRaceResultDialog;
