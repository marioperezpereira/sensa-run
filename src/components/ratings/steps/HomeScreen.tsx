
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { getRandomQuote } from "@/data/motivationalQuotes";
import { LoadingSpinner } from "../../LoadingSpinner";

interface HomeScreenProps {
  onContinue: () => void;
}

export const HomeScreen = ({ onContinue }: HomeScreenProps) => {
  const [quote, setQuote] = useState({ text: "", author: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  const handleContinue = () => {
    setIsLoading(true);
    onContinue();
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-none">
      <div className="flex flex-col items-center space-y-8 py-6">
        <div className="text-center max-w-md">
          <blockquote className="text-xl italic font-medium text-sensa-purple mb-2">
            "{quote.text}"
          </blockquote>
          <p className="text-sm text-gray-500 mb-6">— {quote.author}</p>
          
          {isLoading ? (
            <div className="flex flex-col items-center mt-4">
              <LoadingSpinner />
              <p className="mt-2 text-sensa-purple">Cargando entrenamientos...</p>
            </div>
          ) : (
            <Button 
              onClick={handleContinue}
              className="bg-sensa-purple hover:bg-sensa-purple/90 text-white mt-4"
              size="lg"
            >
              ¿Quieres entrenar hoy? <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
