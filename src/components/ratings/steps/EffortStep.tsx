
import { EffortRating } from "../../EffortRating";

interface EffortStepProps {
  activity: any;
  onCompleted: () => void;
}

export const EffortStep = ({ activity, onCompleted }: EffortStepProps) => {
  return (
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
        onRatingSubmitted={onCompleted}
      />
    </div>
  );
};
