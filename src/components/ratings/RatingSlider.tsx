
import { useState } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

interface RatingSliderProps {
  onSubmit: (rating: number) => void;
  context?: 'energy' | 'effort';
}

export const RatingSlider = ({ onSubmit, context = 'effort' }: RatingSliderProps) => {
  const [rating, setRating] = useState<number>(5);

  const labels = {
    energy: {
      min: "Estoy agotado",
      max: "Lleno de energía"
    },
    effort: {
      min: "Fácil",
      max: "Máximo"
    }
  };

  return (
    <div className="space-y-8">
      <Slider
        defaultValue={[5]}
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
