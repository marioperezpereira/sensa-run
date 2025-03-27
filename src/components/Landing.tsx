
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Smile, Frown, Bandage } from "lucide-react";

export const Landing = () => {
  const navigate = useNavigate();

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
                <CardTitle className="text-2xl font-bold text-sensa-purple text-center">
                  Porque no somos robots
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-sensa-purple/10 p-3">
                      <Smile className="h-8 w-8 text-sensa-purple" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-sensa-purple/10 p-3">
                      <Frown className="h-8 w-8 text-sensa-purple" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-sensa-purple/10 p-3">
                      <Bandage className="h-8 w-8 text-sensa-purple" />
                    </div>
                  </div>
                </div>
                <p className="text-center text-lg text-gray-700">
                  Sensa te ayuda a entrenar escuchando tu cuerpo recomendándote cada día un entrenamiento basado en tus sensaciones y objetivos.
                </p>
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
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="rounded-full bg-sensa-purple/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <span className="text-xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Entrena con tu objetivo claro</h3>
                  <p className="text-gray-600 flex-grow">
                    Dinos cuándo quieres correr tu próxima carrera: tu sesión diaria está diseñada para afrontarla con la mayor de las garantías.
                  </p>
                </CardContent>
              </Card>

              {/* Beneficio 2 */}
              <Card className="border border-gray-200 shadow-sm h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="rounded-full bg-sensa-purple/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <span className="text-xl">👂</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Tus sensaciones importan</h3>
                  <p className="text-gray-600 flex-grow">
                    Registra cómo te sientes para recibir una recomendación que respete tu cuerpo.
                  </p>
                </CardContent>
              </Card>

              {/* Beneficio 3 */}
              <Card className="border border-gray-200 shadow-sm h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="rounded-full bg-sensa-purple/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <span className="text-xl">🔄</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Integración con Strava</h3>
                  <p className="text-gray-600 flex-grow">
                    Si lo deseas, puedes conectar tu cuenta para aconsejarte mejor basándonos en tus entrenamientos previos.
                  </p>
                </CardContent>
              </Card>
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
