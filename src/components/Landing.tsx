
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const Landing = () => {
  const navigate = useNavigate();
  const [showAnimation, setShowAnimation] = useState(false);

  const handleAnimateClick = () => {
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20 p-6">
      <div className="max-w-2xl mx-auto text-center space-y-8 flex-1 flex items-center">
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-6">
            <img 
              src="/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png" 
              alt="Sensa" 
              className={`h-64 w-64 ${showAnimation ? 'animate-bounce' : ''}`}
            />
            <h1 className="text-5xl font-bold text-sensa-purple tracking-tight">Sensa</h1>
            <h2 className="text-3xl font-medium text-gray-800 max-w-lg leading-tight tracking-tight">
              Alcanza tus objetivos, entrena por sensaciones
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/auth")}
                className="bg-sensa-purple hover:bg-sensa-purple/90 text-white px-8 py-6 h-auto text-lg rounded-[42px] font-medium tracking-wide transform transition hover:scale-105"
              >
                Descubre Sensa
              </Button>
              <Button 
                onClick={handleAnimateClick}
                variant="outline"
                className="border-sensa-purple text-sensa-purple hover:bg-sensa-purple/10 px-8 py-6 h-auto text-lg rounded-[42px] font-medium tracking-wide transform transition hover:scale-105"
              >
                Animar Logo
              </Button>
            </div>
            <div>
              <img 
                src="/lovable-uploads/ad9bf09c-d585-4525-90d8-155a9006ca68.png" 
                alt="Compatible with Strava" 
                className="h-8 mx-auto"
              />
            </div>
            <div className="pt-4">
              <img 
                src="/lovable-uploads/b5c87f98-f07e-494a-a9f1-4c9ee5f239c8.png" 
                alt="New Feature" 
                className="h-20 mx-auto rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full text-center py-4">
        <Button 
          variant="link" 
          onClick={() => navigate("/privacy")}
          className="text-sm text-gray-600 hover:text-sensa-purple"
        >
          Política de privacidad
        </Button>
      </footer>
    </div>
  );
};
