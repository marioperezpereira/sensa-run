
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20 p-6">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="flex flex-col items-center space-y-6">
          <img 
            src="/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png" 
            alt="Sensa" 
            className="h-64 w-64"
          />
          <h1 className="text-5xl font-bold text-sensa-purple tracking-tight">Sensa</h1>
          <h2 className="text-3xl font-medium text-gray-800 max-w-lg leading-tight tracking-tight">
            Alcanza tus objetivos, entrena por sensaciones
          </h2>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-sensa-purple hover:bg-sensa-purple/90 text-white px-8 py-6 h-auto text-lg rounded-[42px] font-medium tracking-wide transform transition hover:scale-105 w-full sm:w-auto"
          >
            Descubre Sensa
          </Button>
          <div>
            <img 
              src="/lovable-uploads/compatible.png" 
              alt="Compatible with Strava" 
              className="h-8 mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
