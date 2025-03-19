
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
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

  return (
    <Button 
      variant="outline" 
      className="w-full rounded-[42px] text-red-600 hover:text-red-600"
      onClick={handleLogout}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Cerrar sesión
    </Button>
  );
};

export default LogoutButton;
