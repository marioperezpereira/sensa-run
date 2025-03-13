
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileActionsProps {
  userId: string | undefined;
  onResetClick: () => void;
}

const ProfileActions = ({ userId, onResetClick }: ProfileActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
