
import { EnergyRating } from "../../EnergyRating";

interface EnergyStepProps {
  onCompleted: () => void;
}

export const EnergyStep = ({ onCompleted }: EnergyStepProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-sensa-purple">Nivel de energía</h2>
      <p className="text-gray-700">
        En una escala del 1 al 10, ¿cómo calificarías tu nivel de energía hoy?
        Donde 1 es completamente agotado y 10 es lleno de energía.
      </p>
      <EnergyRating onCompleted={onCompleted} />
    </div>
  );
};
