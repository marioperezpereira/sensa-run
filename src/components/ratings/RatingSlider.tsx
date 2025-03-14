
import { useState } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

interface RatingSliderProps {
  onSubmit: (rating: number) => void;
}

export const RatingSlider = ({ onSubmit }: RatingSliderProps) => {
  const [rating, setRating] = useState<number>(5);

  return (
    <div className="space-y-8">
      <div className="space-y-6 relative">
        <Slider
          value={[rating]}
          onValueChange={(value) => setRating(value[0])}
          max={10}
          min={1}
          step={1}
          className="py-4"
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>Fácil</span>
          <span>Moderado</span>
          <span>Máximo</span>
        </div>
      </div>
      
      <Button
        onClick={() => onSubmit(rating)}
        className="w-full bg-sensa-purple hover:bg-sensa-purple/90 text-white rounded-[42px] py-4"
      >
        Enviar valoración
      </Button>
    </div>
  );
};
