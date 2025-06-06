
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface StravaStepProps {
  onSkip: () => void;
  onNext: () => void;
}

export const StravaStep = ({ onSkip, onNext }: StravaStepProps) => {
  const { toast } = useToast();

  const handleConnectStrava = async () => {
    try {
      console.log('Starting Strava connection process...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para conectar con Strava",
          variant: "destructive",
        });
        return;
      }

      console.log("Invoking strava-oauth edge function for user:", user.id);
      const { data, error } = await supabase.functions.invoke('strava-oauth', {
        body: { user_id: user.id }
      });

      if (error) {
        console.error("Strava OAuth error:", error);
        throw error;
      }
      if (!data?.url) throw new Error('No se recibió la URL de autorización');

      console.log('Redirecting to Strava authorization URL:', data.url);
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Error connecting to Strava:', error);
      toast({
        title: "Error",
        description: "No se pudo conectar con Strava. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-800 text-sm md:text-base">
        Conecta con Strava para recoger tus últimas actividades y personalizar mejor tu entrenamiento
      </p>
      <div className="flex flex-col items-center gap-3">
        <div className="max-w-48 w-full">
          <button onClick={handleConnectStrava} className="w-full p-0 border-0">
            <img 
              src="/lovable-uploads/d5ae09c9-5cfe-42e6-92bc-37a0d851af39.png" 
              alt="Connect with Strava"
              className="w-full"
            />
          </button>
        </div>
        <Button 
          onClick={onSkip}
          variant="outline"
          className="max-w-48 w-full py-4 rounded-[42px]"
        >
          Continuar sin Strava
        </Button>
      </div>
    </div>
  );
};
