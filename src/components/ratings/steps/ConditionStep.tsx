
import { ConditionSelection } from "../../ConditionSelection";

interface ConditionStepProps {
  onCompleted: (condition: string) => void;
}

export const ConditionStep = ({ onCompleted }: ConditionStepProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-sensa-purple">Estado general</h2>
      <p className="text-gray-700">
        Por último, ¿hay alguna condición especial que quieras registrar sobre 
        cómo te sientes hoy?
      </p>
      <ConditionSelection onCompleted={onCompleted} />
    </div>
  );
};
