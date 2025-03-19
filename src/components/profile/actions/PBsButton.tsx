
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PBsButton = () => {
  const navigate = useNavigate();
  const [showButton, setShowButton] = useState(false);
  
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === 'mario@mario.com') {
        setShowButton(true);
      }
    };
    
    checkAccess();
  }, []);
  
  if (!showButton) {
    return null;
  }
  
  return (
    <Button 
      onClick={() => navigate('/personal-bests')}
      className="w-full flex items-center justify-center bg-[#FEF7CD] text-black hover:bg-[#FEF0A0]"
    >
      <Trophy className="mr-2 h-4 w-4" />
      PBs
    </Button>
  );
};

export default PBsButton;
