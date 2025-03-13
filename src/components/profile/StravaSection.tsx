
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface StravaSectionProps {
  onboardingData: any;
}

const StravaSection = ({ onboardingData }: StravaSectionProps) => {
  const { toast } = useToast();

  const handleConnectStrava = async () => {
    try {
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
    <div className="space-y-2">
      <p className="text-sm text-gray-500">Strava</p>
      {onboardingData?.strava_profile ? (
        <a 
          href={onboardingData.strava_profile}
          target="_blank"
          rel="noopener noreferrer"
          className="text-telegram-blue hover:text-telegram-dark flex items-center gap-1"
        >
          Ver perfil <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-900">No conectado</p>
          <div className="max-w-48 w-full">
            <button onClick={handleConnectStrava} className="w-full p-0 border-0">
              <img 
                src="/lovable-uploads/d5ae09c9-5cfe-42e6-92bc-37a0d851af39.png" 
                alt="Connect with Strava"
                className="w-full"
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StravaSection;
