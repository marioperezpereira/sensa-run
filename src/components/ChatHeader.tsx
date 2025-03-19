
import { Button } from "@/components/ui/button";
import { UserRound, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const ChatHeader = () => {
  const navigate = useNavigate();
  const [showPBButton, setShowPBButton] = useState(false);
  
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === 'mario@mario.com') {
        setShowPBButton(true);
      }
    };
    
    checkAccess();
  }, []);

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="flex items-center gap-3 hover:bg-transparent p-0"
              onClick={() => navigate("/app")}
            >
              <img 
                src="/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png" 
                alt="Sensa" 
                className="h-10 w-10"
              />
              <span className="font-semibold text-lg text-sensa-purple tracking-tight">Sensa</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {showPBButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/personal-bests")}
                className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 rounded-xl"
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-xs">PBs</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="text-sensa-purple hover:bg-sensa-purple/10 rounded-xl transform transition hover:scale-105"
            >
              <UserRound className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
