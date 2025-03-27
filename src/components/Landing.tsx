
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Smile, Frown, Bandage, Target, HeartPulse, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export const Landing = () => {
  const navigate = useNavigate();
  const [emojiIndex, setEmojiIndex] = useState(0);
  
  const emojis = [
    { icon: <Smile className="h-8 w-8 text-sensa-purple" />, label: "Feliz" },
    { icon: <Frown className="h-8 w-8 text-sensa-purple" />, label: "Cansado" },
    { icon: <Bandage className="h-8 w-8 text-sensa-purple" />, label: "Lesionado" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % emojis.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20">
      {/* Sección 1: Hero principal */}
      <div className="w-full max-w-5xl mx-auto text-center space-y-8 flex-1 flex items-center p-6">
        <div className="w-full space-y-12">
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
                src="/lovable-uploads/ad9bf09c-d585-4525-90d8-155a9006ca68.png" 
                alt="Compatible with Strava" 
                className="h-8 mx-auto"
              />
            </div>
          </div>

          {/* Sección 2: Breve explicación del valor */}
          <div className="py-12 px-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex justify-center">
                  <div className="relative h-16 w-16">
                    {emojis.map((emoji, index) => (
                      <div 
                        key={index} 
                        className={`absolute top-0 left-0 rounded-full bg-sensa-purple/10 p-3 w-full h-full flex items-center justify-center transition-all duration-500 ${
                          index === emojiIndex 
                            ? "opacity-100 transform scale-100 rotate-0" 
                            : "opacity-0 transform scale-75 rotate-90"
                        }`}
                      >
                        {emoji.icon}
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <CardTitle className="text-2xl font-bold text-sensa-purple text-center">
                  Porque no somos robots
                </CardTitle>
                <p className="text-center text-lg text-gray-700">
                  Sensa te ayuda a entrenar escuchando tu cuerpo recomendándote cada día un entrenamiento basado en tus sensaciones y objetivos.
                </p>
                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={() => navigate("/auth")}
                    className="bg-sensa-purple hover:bg-sensa-purple/90 text-white px-8 py-6 h-auto text-lg rounded-[42px] font-medium tracking-wide transform transition hover:scale-105 w-full sm:w-auto"
                  >
                    Descubre Sensa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sección 3: Lista de beneficios */}
          <div className="py-12 px-4">
            <h2 className="text-3xl font-semibold text-sensa-purple mb-8 text-center">
              ¿Cómo te ayuda Sensa.run?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Beneficio 1 */}
              <Card className="border border-gray-200 shadow-sm h-full">
                <CardContent className="p-6 flex flex-col h-full items-center">
                  <div className="rounded-full bg-sensa-purple/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-sensa-purple" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-center">Entrena con tu objetivo claro</h3>
                  <p className="text-gray-600 flex-grow text-center">
                    Dinos cuándo quieres correr tu próxima carrera: tu sesión diaria está diseñada para afrontarla con la mayor de las garantías.
                  </p>
                </CardContent>
              </Card>

              {/* Beneficio 2 */}
              <Card className="border border-gray-200 shadow-sm h-full">
                <CardContent className="p-6 flex flex-col h-full items-center">
                  <div className="rounded-full bg-sensa-purple/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <HeartPulse className="h-6 w-6 text-sensa-purple" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-center">Tus sensaciones importan</h3>
                  <p className="text-gray-600 flex-grow text-center">
                    Registra cómo te sientes para recibir una recomendación que respete tu cuerpo.
                  </p>
                </CardContent>
              </Card>

              {/* Beneficio 3 */}
              <Card className="border border-gray-200 shadow-sm h-full">
                <CardContent className="p-6 flex flex-col h-full items-center">
                  <div className="rounded-full bg-sensa-purple/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <RefreshCw className="h-6 w-6 text-sensa-purple" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-center">Integración con Strava</h3>
                  <p className="text-gray-600 flex-grow text-center">
                    Si lo deseas, puedes conectar tu cuenta para aconsejarte mejor basándonos en tus entrenamientos previos.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={() => navigate("/auth")}
                className="bg-sensa-purple hover:bg-sensa-purple/90 text-white px-8 py-6 h-auto text-lg rounded-[42px] font-medium tracking-wide transform transition hover:scale-105 w-full sm:w-auto"
              >
                Descubre Sensa
              </Button>
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
