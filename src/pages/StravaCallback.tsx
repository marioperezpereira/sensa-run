import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        console.error("Strava auth error:", error);
        toast({
          title: "Error",
          description: "No se pudo conectar con Strava. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (!code || !state) {
        console.error("Missing code or state");
        toast({
          title: "Error",
          description: "Parámetros de autenticación inválidos",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("User not authenticated");
          toast({
            title: "Error",
            description: "Usuario no autenticado",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        const { data: onboardingData, error: onboardingError } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (onboardingError || !onboardingData) {
          console.error('Error fetching onboarding data:', onboardingError);
          toast({
            title: "Error",
            description: "No se encontraron tus datos de onboarding. Por favor, completa el formulario de nuevo.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        const { data, error } = await supabase.functions.invoke('strava-token-exchange', {
          body: { code },
          headers: { 'x-user-id': user.id }
        });

        if (error) throw error;

        if (data?.athlete_id) {
          const { error: updateError } = await supabase
            .from('user_onboarding')
            .update({
              strava_profile: `https://www.strava.com/athletes/${data.athlete_id}`,
              completed_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        }

        toast({
          title: "¡Conectado!",
          description: "Tu cuenta de Strava ha sido conectada exitosamente.",
        });

        navigate("/", { replace: true });
      } catch (error: any) {
        console.error("Error exchanging token:", error);
        toast({
          title: "Error",
          description: "Error al conectar con Strava. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    handleCallback();
  }, [searchParams, toast, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-telegram-light to-white">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Conectando con Strava...</h2>
        <p className="text-gray-600">Por favor espera mientras procesamos tu autorización.</p>
      </div>
    </div>
  );
};

export default StravaCallback;
