
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { registerPushNotifications } from "@/utils/notifications";
import { checkAndSaveExistingSubscription } from "@/utils/sendNotification";

interface NotificationControlsProps {
  userId: string | undefined;
}

const NotificationControls = ({ userId }: NotificationControlsProps) => {
  const { toast } = useToast();
  const [showNotificationButton, setShowNotificationButton] = useState(false);
  const [notificationsActive, setNotificationsActive] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

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
              
              // Save debug info about the subscription
              const subscriptionJSON = JSON.stringify(subscription, null, 2);
              console.log('Current active subscription:', subscriptionJSON);
              setDebugInfo(`Subscription endpoint: ${subscription.endpoint.substring(0, 50)}...`);
              
              await checkAndSaveExistingSubscription();
            } else {
              setDebugInfo('No active push subscription found');
            }
          } catch (error) {
            console.error('Error checking push subscription:', error);
            setDebugInfo(`Error checking subscription: ${error instanceof Error ? error.message : String(error)}`);
          } finally {
            setIsRecovering(false);
          }
        } else {
          setDebugInfo(`Current notification permission: ${currentPermission}`);
        }
      } else {
        setDebugInfo('Notifications or Service Worker not supported');
      }
      
      // Show notification button if supported
      setShowNotificationButton(hasNotificationSupport && currentPermission !== 'denied');
    };

    checkNotificationSupport();
  }, []);

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
        setDebugInfo(`Permission request denied: ${permission}`);
        return;
      }

      // Try PWA push notifications first if service worker is available
      if ('serviceWorker' in navigator) {
        setDebugInfo('Registering push notifications...');
        const subscription = await registerPushNotifications();
        if (subscription) {
          const subscriptionJSON = JSON.stringify(subscription, null, 2);
          console.log('New subscription created:', subscriptionJSON);
          setDebugInfo(`Subscription created with endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          
          toast({
            title: "¡Éxito!",
            description: "Las notificaciones push han sido habilitadas",
          });
          setNotificationsActive(true);
          return;
        } else {
          setDebugInfo('Failed to register push notifications');
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
      setDebugInfo('Using standard web notifications (not push)');

    } catch (error) {
      console.error('Error enabling notifications:', error);
      setDebugInfo(`Error enabling notifications: ${error instanceof Error ? error.message : String(error)}`);
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
            setDebugInfo('Failed to unsubscribe from push notifications');
            throw new Error("Failed to unsubscribe from push notifications");
          }
          
          console.log('Successfully unsubscribed from push notifications');
          setDebugInfo('Successfully unsubscribed from push notifications');
          
          // Remove subscription from database if user is logged in
          if (userId) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', userId)
              .eq('endpoint', subscription.endpoint);
            
            console.log('Successfully removed subscription from database');
            setDebugInfo('Subscription removed from database');
          }
          
          toast({
            title: "Notificaciones desactivadas",
            description: "Has desactivado las notificaciones correctamente",
          });
          
          setNotificationsActive(false);
        } else {
          console.log('No active subscription found to disable');
          setDebugInfo('No active subscription found to disable');
          toast({
            title: "No hay notificaciones activas",
            description: "No se encontraron notificaciones activas para desactivar",
          });
          setNotificationsActive(false);
        }
      } else {
        setDebugInfo('Service Worker not supported');
        toast({
          title: "No soportado",
          description: "Tu navegador no soporta notificaciones push",
        });
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      setDebugInfo(`Error disabling notifications: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: "Hubo un error al desactivar las notificaciones",
        variant: "destructive"
      });
    }
  };

  const handleTest = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Necesitas iniciar sesión para probar las notificaciones",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setDebugInfo('Sending test notification...');
      
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: { 
          user_id: userId, 
          title: "Prueba de notificación", 
          message: "Esta es una prueba de notificación push", 
          url: "/profile" 
        }
      });
      
      if (error) {
        console.error('Error sending test notification:', error);
        setDebugInfo(`Error sending test: ${error.message}`);
        toast({
          title: "Error",
          description: `Error al enviar la notificación de prueba: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('Test notification result:', data);
      setDebugInfo(`Test notification result: ${JSON.stringify(data, null, 2)}`);
      
      if (data.success) {
        toast({
          title: "Prueba enviada",
          description: "Notificación de prueba enviada correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al enviar la notificación de prueba",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Exception sending test notification:', error);
      setDebugInfo(`Exception sending test: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: "Error al enviar la notificación de prueba",
        variant: "destructive"
      });
    }
  };

  if (!showNotificationButton) return null;

  return (
    <div className="space-y-4">
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
      
      {notificationsActive && (
        <Button
          variant="outline"
          className="w-full rounded-[42px] border-sensa-purple text-sensa-purple hover:bg-sensa-purple/10"
          onClick={handleTest}
        >
          <Info className="mr-2 h-4 w-4" />
          Probar notificación
        </Button>
      )}
      
      {debugInfo && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded overflow-auto max-h-20">
          <p className="font-mono">{debugInfo}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationControls;
