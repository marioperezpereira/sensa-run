
import { useState } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RatingSliderProps {
  onSubmit: (rating: number) => void;
}

export const RatingSlider = ({ onSubmit }: RatingSliderProps) => {
  const [rating, setRating] = useState<number>(5);

  const getLabel = (value: number) => {
    if (value <= 3) return 'Fácil';
    if (value <= 7) return 'Moderado';
    return 'Máximo';
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6 relative">
        <TooltipProvider>
          <Tooltip open={true}>
            <TooltipTrigger asChild>
              <Slider
                value={[rating]}
                onValueChange={(value) => setRating(value[0])}
                max={10}
                min={1}
                step={1}
                className="py-4"
              />
            </TooltipTrigger>
            <TooltipContent 
              className="bg-sensa-purple text-white text-xs font-medium px-2 py-1 transition-transform duration-200"
              side="top"
              sideOffset={5}
              style={{
                position: 'absolute',
                left: `${((rating - 1) / 9) * 100}%`,
                transform: 'translateX(-50%)',
                top: '0'
              }}
            >
              {rating}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
