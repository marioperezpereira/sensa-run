
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationControlsProps {
  userId: string | undefined;
}

const NotificationControls = ({ userId }: NotificationControlsProps) => {
  const { toast } = useToast();
  const [showNotificationButton, setShowNotificationButton] = useState(false);
  const [notificationsActive, setNotificationsActive] = useState(false);

  useEffect(() => {
    const checkNotificationSupport = async () => {
      const hasNotificationSupport = 'Notification' in window;
      let currentPermission = "default";
      
      if (hasNotificationSupport) {
        currentPermission = Notification.permission;
        setNotificationsActive(currentPermission === 'granted');
      }
      
      setShowNotificationButton(hasNotificationSupport && currentPermission !== 'denied');
    };

    checkNotificationSupport();
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Error",
          description: "Necesitamos tu permiso para enviar notificaciones",
          variant: "destructive"
        });
        return;
      }

      // Display a test notification
      new Notification("Sensa.run", {
        body: "Las notificaciones han sido habilitadas",
        icon: "/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png"
      });

      toast({
        title: "¡Éxito!",
        description: "Las notificaciones han sido habilitadas",
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
      // Simply mark notifications as inactive since browsers don't actually
      // provide a way to revoke notification permissions programmatically
      setNotificationsActive(false);
      toast({
        title: "Notificaciones desactivadas",
        description: "Has desactivado las notificaciones correctamente",
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: "Error",
        description: "Hubo un error al desactivar las notificaciones",
        variant: "destructive"
      });
    }
  };

  if (!showNotificationButton) return null;

  return (
    <div>
      <Button 
        variant="outline" 
        className="w-full rounded-[42px] border-sensa-purple text-sensa-purple hover:bg-sensa-purple/10"
        onClick={notificationsActive ? handleDisableNotifications : handleEnableNotifications}
      >
        {notificationsActive ? (
          <>
            <BellOff className="mr-2 h-4 w-4" />
            Desactivar notificaciones
          </>
        ) : (
          <>
            <Bell className="mr-2 h-4 w-4" />
            Habilitar notificaciones
          </>
        )}
      </Button>
    </div>
  );
};

export default NotificationControls;
