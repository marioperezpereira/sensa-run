
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

  const energyOptions = [
    { label: "🤩 ¡Me siento a tope!", value: 4 },
    { label: "😉 Me noto algo cansado, pero estoy bien", value: 3 },
    { label: "🫠 Estoy bastante fatigado", value: 2 },
    { label: "🥵 ¡Casi no me puedo ni mover!", value: 1 },
  ];

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
      <div className="space-y-3">
        {energyOptions.map((option) => (
          <Button
            key={option.value}
            onClick={() => setSelectedEnergy(option.value)}
            className={`w-full justify-start text-left py-4 h-auto ${
              selectedEnergy === option.value 
                ? "bg-violet-100 text-violet-800 border-2 border-violet-500" 
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
            variant="outline"
          >
            <span className="text-lg mr-2">{option.label}</span>
          </Button>
        ))}
      </div>
      
      <Button
        onClick={handleSubmit}
        className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-[42px] py-4"
        disabled={selectedEnergy === null}
      >
        Continuar
      </Button>
    </div>
  );
};
