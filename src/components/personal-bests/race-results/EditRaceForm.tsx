import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { RaceResult, RaceFormValues, raceFormSchema, SurfaceType, TrackType } from "./types";
import RaceDateField from "./RaceDateField";
import TimeFields from "./TimeFields";
import DistanceField from "./DistanceField";
import SurfaceTypeField from "./SurfaceTypeField";
import TrackTypeField from "./TrackTypeField";

interface EditRaceFormProps {
  result: RaceResult;
  onResultUpdated: (updatedResult: RaceResult) => void;
  onCancel: () => void;
}

const EditRaceForm = ({ result, onResultUpdated, onCancel }: EditRaceFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const surfaceType = result.surface_type || "Asfalto";
  const trackType = result.track_type;
  
  const form = useForm<RaceFormValues>({
    resolver: zodResolver(raceFormSchema),
    defaultValues: {
      surfaceType: surfaceType as SurfaceType,
      trackType: trackType as TrackType,
      distance: result.distance,
      raceDate: new Date(result.race_date),
      hours: result.hours,
      minutes: result.minutes,
      seconds: result.seconds,
    },
  });

  // Reset track type when surface type changes
  const currentSurfaceType = form.watch("surfaceType");
  useEffect(() => {
    if (currentSurfaceType === "Asfalto") {
      form.setValue("trackType", undefined);
      form.setValue("distance", "");
    } else if (currentSurfaceType === "Pista de atletismo" && !form.getValues("trackType")) {
      form.setValue("distance", "");
    }
  }, [currentSurfaceType, form]);

  // Reset distance when track type changes
  const currentTrackType = form.watch("trackType");
  useEffect(() => {
    if (currentTrackType && currentTrackType !== trackType) {
      form.setValue("distance", "");
    }
  }, [currentTrackType, trackType, form]);

  const onSubmit = async (values: RaceFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('race_results')
        .update({
          distance: values.distance,
          race_date: format(values.raceDate, 'yyyy-MM-dd'),
          hours: values.hours,
          minutes: values.minutes,
          seconds: values.seconds,
          surface_type: values.surfaceType,
          track_type: values.trackType || null,
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
        distance: values.distance,
        race_date: format(values.raceDate, 'yyyy-MM-dd'),
        hours: values.hours,
        minutes: values.minutes,
        seconds: values.seconds,
        surface_type: values.surfaceType,
        track_type: values.trackType,
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <SurfaceTypeField form={form} />
        <TrackTypeField form={form} />
        <DistanceField form={form} />
        <RaceDateField form={form} />
        <TimeFields form={form} />
        
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Actualizar"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default EditRaceForm;
