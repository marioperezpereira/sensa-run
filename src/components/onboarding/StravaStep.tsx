
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

      const { data, error } = await supabase.functions.invoke('strava-oauth', {
        body: { user_id: user.id }
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No se recibió la URL de autorización');

      console.log('Redirecting to Strava authorization URL...');
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
      <div className="space-y-2">
        <Button 
          onClick={handleConnectStrava}
          className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white py-4 rounded-[42px]"
        >
          Conectar con Strava
        </Button>
        <Button 
          onClick={() => {
            console.log('Skipping Strava connection...');
            onSkip();
          }}
          variant="outline"
          className="w-full py-4 rounded-[42px]"
        >
          Continuar sin Strava
        </Button>
      </div>
    </div>
  );
};

