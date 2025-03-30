
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EnergyStepProps {
  onCompleted: () => void;
  onBack?: () => void;
}

export const EnergyStep = ({ onCompleted, onBack }: EnergyStepProps) => {
  const { toast } = useToast();
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);
  const [hasSelected, setHasSelected] = useState<boolean>(false);

  const energyOptions = [
    { label: "🤩 ¡Me siento a tope!", value: 4 },
    { label: "😉 Me noto algo cansado, pero bien", value: 3 },
    { label: "🫠 Estoy bastante fatigado", value: 2 },
    { label: "🥵 ¡Casi no me puedo ni mover!", value: 1 },
  ];

  const handleSelection = (value: number) => {
    setSelectedEnergy(value);
    setHasSelected(true); // Mark that user has made a selection
  };

  const handleSubmit = async () => {
    if (selectedEnergy === null) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('daily_conditions')
        .insert({
          user_id: user.id,
          energy_level: selectedEnergy,
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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-sensa-purple text-center">Nivel de energía</h2>
      <p className="text-gray-700">
        ¿Cómo te encuentras hoy? Selecciona la opción que mejor describa tu estado actual:
      </p>
      <div className="grid grid-cols-1 gap-2">
        {energyOptions.map((option) => (
          <Button
            key={option.value}
            onClick={() => handleSelection(option.value)}
            className={`justify-start text-left rounded-xl py-4 ${
              selectedEnergy === option.value ? 'ring-2 ring-offset-2 ring-sensa-purple bg-sensa-purple/10' : ''
            }`}
            variant="outline"
          >
            {option.label}
          </Button>
        ))}
      </div>
      
      {hasSelected && (
        <Button
          onClick={handleSubmit}
          className="w-full bg-sensa-purple hover:bg-sensa-purple/90 text-white rounded-[42px] py-4"
        >
          Continuar
        </Button>
      )}
    </div>
  );
};
