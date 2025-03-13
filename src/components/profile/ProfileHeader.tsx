
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileHeader = () => {
  const navigate = useNavigate();
  
  return (
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
  );
};

export default ProfileHeader;
