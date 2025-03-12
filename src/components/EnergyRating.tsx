
import { useState } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EnergyRatingProps {
  onCompleted: () => void;
}

export const EnergyRating = ({ onCompleted }: EnergyRatingProps) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const { toast } = useToast();

  const getColorForRating = (rating: number) => {
    const colors = [
      'bg-red-500 hover:bg-red-600',
      'bg-red-400 hover:bg-red-500',
      'bg-orange-400 hover:bg-orange-500',
      'bg-orange-300 hover:bg-orange-400',
      'bg-yellow-400 hover:bg-yellow-500',
      'bg-yellow-300 hover:bg-yellow-400',
      'bg-yellow-200 hover:bg-yellow-300',
      'bg-green-300 hover:bg-green-400',
      'bg-green-200 hover:bg-green-300',
      'bg-green-100 hover:bg-green-200',
    ];
    return colors[rating - 1];
  };

  const handleSubmit = async () => {
    if (!selectedRating) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('daily_conditions')
        .insert({
          user_id: user.id,
          energy_level: selectedRating,
        });

      if (error) throw error;

      toast({
        title: "¡Gracias!",
        description: "Tu nivel de energía ha sido guardado.",
      });

      onCompleted();
    } catch (error) {
      console.error('Error saving energy level:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu nivel de energía. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
          <Button
            key={rating}
            onClick={() => setSelectedRating(rating)}
            className={`w-10 h-10 ${getColorForRating(rating)} ${
              selectedRating === rating ? 'ring-2 ring-offset-2 ring-sensa-purple' : ''
            } rounded-xl`}
            variant="outline"
          >
            {rating}
          </Button>
        ))}
      </div>
      {selectedRating && (
        <Button
          onClick={handleSubmit}
          className="w-full bg-sensa-purple hover:bg-sensa-purple/90 text-white rounded-[42px] py-6 h-auto"
        >
          Enviar nivel de energía
        </Button>
      )}
    </div>
  );
};
