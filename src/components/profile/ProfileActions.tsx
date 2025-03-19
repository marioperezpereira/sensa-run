
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, RefreshCcw, Bell, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { registerPushNotifications } from "@/utils/notifications";
import { checkAndSaveExistingSubscription } from "@/utils/sendNotification";
import { useEffect, useState } from "react";

interface ProfileActionsProps {
  userId: string | undefined;
  onResetClick: () => void;
}

const ProfileActions = ({ userId, onResetClick }: ProfileActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showNotificationButton, setShowNotificationButton] = useState(false);
  const [notificationsActive, setNotificationsActive] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and if they are already registered
    const checkNotificationSupport = async () => {
      const hasNotificationSupport = 'Notification' in window && 'serviceWorker' in navigator;
      let currentPermission = "default";
      
      if (hasNotificationSupport) {
        currentPermission = Notification.permission;
        
        // Check if we have an active service worker with push subscription
        if (currentPermission === 'granted') {
          setIsRecovering(true);
          try {
            // Check if we have a registered service worker
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
              setNotificationsActive(true);
              await checkAndSaveExistingSubscription();
            }
          } catch (error) {
            console.error('Error checking push subscription:', error);
          } finally {
            setIsRecovering(false);
          }
        }
      }
      
      // Show notification button if supported
      setShowNotificationButton(hasNotificationSupport && currentPermission !== 'denied');
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
          setNotificationsActive(true);
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
      setNotificationsActive(true);

    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "Hubo un error al habilitar las notificaciones",
        variant: "destructive"
      });
    }
  };

  const handleDisableNotifications = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          // Unsubscribe from push notifications
          const successful = await subscription.unsubscribe();
          
          if (!successful) {
            throw new Error("Failed to unsubscribe from push notifications");
          }
          
          console.log('Successfully unsubscribed from push notifications');
          
          // Remove subscription from database if user is logged in
          if (userId) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', userId)
              .eq('endpoint', subscription.endpoint);
            
            console.log('Successfully removed subscription from database');
          }
          
          toast({
            title: "Notificaciones desactivadas",
            description: "Has desactivado las notificaciones correctamente",
          });
          
          setNotificationsActive(false);
        } else {
          console.log('No active subscription found to disable');
          toast({
            title: "No hay notificaciones activas",
            description: "No se encontraron notificaciones activas para desactivar",
          });
          setNotificationsActive(false);
        }
      } else {
        toast({
          title: "No soportado",
          description: "Tu navegador no soporta notificaciones push",
        });
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: "Error",
        description: "Hubo un error al desactivar las notificaciones",
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
          onClick={notificationsActive ? handleDisableNotifications : handleEnableNotifications}
          disabled={isRecovering}
        >
          {notificationsActive ? (
            <>
              <BellOff className="mr-2 h-4 w-4" />
              Desactivar notificaciones
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              {isRecovering ? 'Comprobando notificaciones...' : 'Habilitar notificaciones'}
            </>
          )}
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
