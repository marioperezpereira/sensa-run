import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, RefreshCcw, Home, ExternalLink, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Profile = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: onboarding } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setOnboardingData(onboarding);
      }
    };
    fetchData();
  }, []);

  const formatGoal = () => {
    if (!onboardingData) return "Cargando...";
    
    if (onboardingData.goal_type === "Quiero preparar una carrera lo mejor posible") {
      const formattedDate = onboardingData.race_date ? 
        format(new Date(onboardingData.race_date), "d 'de' MMMM 'de' yyyy", { locale: es }) :
        "fecha no especificada";
      return `Preparando un ${onboardingData.race_distance} el ${formattedDate}`;
    }
    
    return "Sin objetivo específico";
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  const handleResetOnboarding = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "Usuario no encontrado",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_onboarding')
        .delete()
        .match({ user_id: user.id });
      
      if (error) {
        console.error('Error deleting onboarding:', error);
        throw error;
      }
      
      setShowConfirmDialog(false);
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo reiniciar la configuración. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
            <Button 
              variant="ghost"
              onClick={() => navigate("/app")}
              className="text-telegram-blue hover:text-telegram-dark"
            >
              <Home className="mr-2 h-4 w-4" />
              Volver a Sensa
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{user?.email}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500">Próximo objetivo</p>
            <p className="text-gray-900">{formatGoal()}</p>
          </div>

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
                <Button 
                  variant="outline" 
                  onClick={handleConnectStrava}
                  className="w-full bg-[#FC4C02] text-white hover:bg-[#E34402] border-0"
                >
                  Conectar con Strava 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full rounded-[42px] border-sensa-purple text-sensa-purple hover:bg-sensa-purple/10"
              onClick={() => setShowConfirmDialog(true)}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Personalizar experiencia
            </Button>

            <Button 
              variant="outline" 
              className="w-full rounded-[42px] text-red-600 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quieres personalizar de nuevo tu experiencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto borrará tu configuración
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-red-600 text-white hover:bg-red-700">
              No
            </AlertDialogCancel>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleResetOnboarding}
            >
              Sí
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
