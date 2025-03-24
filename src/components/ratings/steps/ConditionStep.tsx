
import { ConditionSelection } from "../../ConditionSelection";
import { Button } from "@/components/ui/button";

interface ConditionStepProps {
  onCompleted: (condition: string) => void;
  onBack?: () => void;
}

export const ConditionStep = ({ onCompleted, onBack }: ConditionStepProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-sensa-purple text-center">Estado general</h2>
      <p className="text-gray-700">
        Por último, ¿hay alguna condición especial que quieras registrar sobre 
        cómo te sientes hoy?
      </p>
      <ConditionSelection onCompleted={onCompleted} />
    </div>
  );
};
