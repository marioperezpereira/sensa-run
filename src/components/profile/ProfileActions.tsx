
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, RefreshCcw, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { registerPushNotifications } from "@/utils/notifications";
import { useEffect, useState } from "react";

interface ProfileActionsProps {
  userId: string | undefined;
  onResetClick: () => void;
}

const ProfileActions = ({ userId, onResetClick }: ProfileActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showNotificationButton, setShowNotificationButton] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const checkNotificationSupport = async () => {
      const hasNotificationSupport = 'Notification' in window;
      const currentPermission = await Notification.permission;
      
      // Only show button if notifications are supported and not already granted
      setShowNotificationButton(hasNotificationSupport && currentPermission !== 'granted');
    };

    checkNotificationSupport();
  }, []);

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
      // Request notification permission first
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Error",
          description: "Necesitamos tu permiso para enviar notificaciones",
          variant: "destructive"
        });
        return;
      }

      // Try PWA push notifications first if service worker is available
      if ('serviceWorker' in navigator) {
        const subscription = await registerPushNotifications();
        if (subscription) {
          toast({
            title: "¡Éxito!",
            description: "Las notificaciones push han sido habilitadas",
          });
          setShowNotificationButton(false);
          return;
        }
      }

      // Fallback to regular web notifications
      const notification = new Notification("Sensa.run", {
        body: "Las notificaciones han sido habilitadas",
        icon: "/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png"
      });

      toast({
        title: "¡Éxito!",
        description: "Las notificaciones web han sido habilitadas",
      });
      setShowNotificationButton(false);

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

      {showNotificationButton && (
        <Button 
          variant="outline" 
          className="w-full rounded-[42px] border-sensa-purple text-sensa-purple hover:bg-sensa-purple/10"
          onClick={handleEnableNotifications}
        >
          <Bell className="mr-2 h-4 w-4" />
          Habilitar notificaciones
        </Button>
      )}

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
