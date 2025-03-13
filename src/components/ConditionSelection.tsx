
import { useState } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ConditionSelectionProps {
  onCompleted: (condition: string) => void;
}

export const ConditionSelection = ({ onCompleted }: ConditionSelectionProps) => {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const { toast } = useToast();

  const conditions = [
    { id: 'physical_discomfort', label: '🤕 Molestias físicas' },
    { id: 'mild_cold', label: '🤧 Algo resfriado' },
    { id: 'stressed', label: '🤯 Estresado' },
    { id: 'stomach_issues', label: '💩 Problemas estomacales' },
    { id: 'all_good', label: '💪 Todo perfecto!' },
  ];

  const handleSubmit = async () => {
    if (!selectedCondition) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('daily_conditions')
        .update({ condition: selectedCondition })
        .eq('user_id', user.id)
        .is('condition', null);

      if (error) throw error;

      toast({
        title: "¡Gracias!",
        description: "Tu condición ha sido guardada.",
      });

      onCompleted(selectedCondition);
    } catch (error) {
      console.error('Error saving condition:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu condición. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2">
        {conditions.map((condition) => (
          <Button
            key={condition.id}
            onClick={() => setSelectedCondition(condition.id)}
            className={`justify-start text-left rounded-xl py-4 ${
              selectedCondition === condition.id ? 'ring-2 ring-offset-2 ring-sensa-purple bg-sensa-purple/10' : ''
            }`}
            variant="outline"
          >
            {condition.label}
          </Button>
        ))}
      </div>
      {selectedCondition && (
        <Button
          onClick={handleSubmit}
          className="w-full bg-sensa-purple hover:bg-sensa-purple/90 text-white rounded-[42px] py-4"
        >
          Confirmar condición
        </Button>
      )}
    </div>
  );
};
