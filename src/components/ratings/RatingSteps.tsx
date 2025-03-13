
import { Card } from "../ui/card";
import { EffortRating } from "../EffortRating";
import { EnergyRating } from "../EnergyRating";
import { ConditionSelection } from "../ConditionSelection";
import type { RatingStep } from "@/hooks/useRatingsFlow";

interface RatingStepsProps {
  currentStep: RatingStep;
  activity: any;
  moveToNextStep: () => void;
  onConditionComplete: (condition: string) => void;
}

export const RatingSteps = ({
  currentStep,
  activity,
  moveToNextStep,
  onConditionComplete
}: RatingStepsProps) => {
  return (
    <Card className="p-6 space-y-4 bg-white/80 backdrop-blur-sm border-none">
      {currentStep === 'effort' && activity && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-sensa-purple">Valoración de tu última actividad</h2>
          <p className="text-gray-700">
            Tu última actividad fue "{activity.name}", {activity.formattedDistance} km 
            el {activity.formattedDate}. En una escala del 1 al 10, donde 1 es un 
            paseo suave y 10 el máximo esfuerzo posible, ¿podrías decirnos cuánto 
            fue el esfuerzo percibido durante esta sesión?
          </p>
          <EffortRating 
            activityId={activity.id}
            onRatingSubmitted={moveToNextStep}
          />
        </div>
      )}

      {currentStep === 'energy' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-sensa-purple">Nivel de energía</h2>
          <p className="text-gray-700">
            En una escala del 1 al 10, ¿cómo calificarías tu nivel de energía hoy?
            Donde 1 es completamente agotado y 10 es lleno de energía.
          </p>
          <EnergyRating onCompleted={moveToNextStep} />
        </div>
      )}

      {currentStep === 'condition' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-sensa-purple">Estado general</h2>
          <p className="text-gray-700">
            Por último, ¿hay alguna condición especial que quieras registrar sobre 
            cómo te sientes hoy?
          </p>
          <ConditionSelection onCompleted={onConditionComplete} />
        </div>
      )}
    </Card>
  );
};
