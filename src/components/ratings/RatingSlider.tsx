
import { useState } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Info } from "lucide-react";

interface RatingSliderProps {
  onSubmit: (rating: number) => void;
  context?: 'energy' | 'effort';
  defaultValue?: number;
}

export const RatingSlider = ({ onSubmit, context = 'effort', defaultValue = 1 }: RatingSliderProps) => {
  const [rating, setRating] = useState<number>(defaultValue);

  const labels = {
    energy: {
      min: "Estoy agotado",
      max: "Lleno de energía"
    },
    effort: {
      min: "Muy ligero",
      max: "Extremo"
    }
  };

  // Effort level descriptions
  const effortDescriptions = {
    1: "Muy, muy ligero (Reposo activo)",
    2: "Muy ligero (Actividad suave, sin esfuerzo)",
    3: "Ligero (Fácil, puedes mantener una conversación completa)",
    4: "Algo pesado (Cómodo, puedes hablar con facilidad)",
    5: "Pesado (Conversación se hace algo difícil)",
    6: "Más pesado (Puedes decir pocas palabras seguidas)",
    7: "Muy pesado (Respiración acelerada, difícil hablar)",
    8: "Muy, muy pesado (Muy difícil mantener el ritmo)",
    9: "Máximo (Casi imposible mantener por mucho tiempo)",
    10: "Extremo (Esfuerzo máximo absoluto)"
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <HoverCard>
          <HoverCardTrigger asChild>
            <button className="text-violet-600 flex items-center text-sm gap-1 hover:text-violet-700 focus:outline-none">
              <Info size={16} />
              <span>Escala de esfuerzo</span>
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 p-0">
            <div className="bg-white rounded-lg border shadow-md">
              <div className="p-4">
                <h4 className="font-medium mb-2 text-center">Escala de Esfuerzo Percibido</h4>
                <div className="space-y-1">
                  {Object.entries(effortDescriptions).map(([level, description]) => {
                    let bgColor;
                    const levelNum = parseInt(level);
                    
                    if (levelNum <= 2) bgColor = "bg-blue-100";
                    else if (levelNum <= 4) bgColor = "bg-green-100";
                    else if (levelNum <= 6) bgColor = "bg-yellow-100";
                    else if (levelNum <= 8) bgColor = "bg-orange-100";
                    else bgColor = "bg-red-100";
                    
                    return (
                      <div key={level} className={`flex items-center px-2 py-1 rounded ${bgColor}`}>
                        <span className="font-bold w-6 text-center">{level}</span>
                        <span className="ml-2 text-xs">{description}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        <div className="bg-violet-100 px-3 py-1 rounded-full text-violet-700 font-medium">
          {rating}
        </div>
      </div>

      <Slider
        defaultValue={[defaultValue]}
        value={[rating]}
        onValueChange={(value) => setRating(value[0])}
        max={10}
        min={1}
        step={1}
        labels={labels[context]}
      />
      
      <div className="text-sm text-gray-600 mt-2">
        <p className="font-medium">{rating}: {effortDescriptions[rating as keyof typeof effortDescriptions]}</p>
      </div>
      
      <Button
        onClick={() => onSubmit(rating)}
        className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-[42px] py-4"
      >
        Enviar valoración
      </Button>
    </div>
  );
};
