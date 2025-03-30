import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import GenderField from "./GenderField";
import DateOfBirthField from "./DateOfBirthField";
import { formSchema, ProfileFormValues } from "./types";
interface PBProfileFormProps {
  onProfileSaved: () => void;
}
const PBProfileForm = ({
  onProfileSaved
}: PBProfileFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema)
  });
  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "No se pudo identificar al usuario",
          variant: "destructive"
        });
        return;
      }
      const {
        error
      } = await supabase.from('user_pb_profiles').insert({
        user_id: user.id,
        gender: values.gender,
        date_of_birth: format(values.dateOfBirth, 'yyyy-MM-dd')
      });
      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar el perfil",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Perfil guardado",
        description: "Tu perfil ha sido guardado correctamente"
      });
      onProfileSaved();
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar tus datos",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Información de perfil</h2>
        <p className="text-sm text-gray-500">
          Para calcular los puntos equivalentes de tus marcas necesitamos algunos datos adicionales.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <GenderField form={form} />
          <DateOfBirthField form={form} />
          
          <Button type="submit" className="w-full bg-sensa-purple hover:bg-sensa-purple/90 text-white" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar información"}
          </Button>
        </form>
      </Form>
    </div>;
};
export default PBProfileForm;