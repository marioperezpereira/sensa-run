
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, RefreshCcw, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { registerPushNotifications } from "@/utils/notifications";

interface ProfileActionsProps {
  userId: string | undefined;
  onResetClick: () => void;
}

const ProfileActions = ({ userId, onResetClick }: ProfileActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleEnableNotifications = async () => {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        toast({
          title: "Error",
          description: "Tu navegador no soporta notificaciones push",
          variant: "destructive"
        });
        return;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Error",
          description: "Necesitamos tu permiso para enviar notificaciones",
          variant: "destructive"
        });
        return;
      }

      // Register for push notifications
      const subscription = await registerPushNotifications();
      
      if (!subscription) {
        toast({
          title: "Error",
          description: "No se pudieron habilitar las notificaciones",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "¡Éxito!",
        description: "Las notificaciones han sido habilitadas",
      });

    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "Hubo un error al habilitar las notificaciones",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        className="w-full rounded-[42px] border-sensa-purple text-sensa-purple hover:bg-sensa-purple/10"
        onClick={onResetClick}
      >
        <RefreshCcw className="mr-2 h-4 w-4" />
        Personalizar experiencia
      </Button>

      <Button 
        variant="outline" 
        className="w-full rounded-[42px] border-sensa-purple text-sensa-purple hover:bg-sensa-purple/10"
        onClick={handleEnableNotifications}
      >
        <Bell className="mr-2 h-4 w-4" />
        Habilitar notificaciones
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
  );
};

export default ProfileActions;
