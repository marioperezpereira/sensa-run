
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
      min: "",
      max: ""
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
  
  const getColorForRating = (ratingValue: number): string => {
    if (ratingValue <= 2) return "bg-blue-100 text-blue-700";
    if (ratingValue <= 4) return "bg-green-100 text-green-700";
    if (ratingValue <= 6) return "bg-yellow-100 text-yellow-700";
    if (ratingValue <= 8) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="text-violet-600 text-sm">
          {effortDescriptions[rating as keyof typeof effortDescriptions].split('(')[0].trim()}
        </div>
        <div className={`px-3 py-1 rounded-full font-medium ${getColorForRating(rating)}`}>
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
      
      <Button
        onClick={() => onSubmit(rating)}
        className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-[42px] py-4"
      >
        Enviar valoración
      </Button>
    </div>
  );
};
