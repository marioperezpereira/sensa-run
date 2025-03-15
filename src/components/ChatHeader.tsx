
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ChatHeader = () => {
  const navigate = useNavigate();

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
  );
};
