
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { Edit } from "lucide-react";
import EditGoalDialog from "./goals/EditGoalDialog";

interface UserInfoProps {
  user: User | null;
  onboardingData: any;
}

const UserInfo = ({ user, onboardingData }: UserInfoProps) => {
  const [showEditGoal, setShowEditGoal] = useState(false);
  
  const formatGoal = () => {
    if (!onboardingData) return "Cargando...";
    
    if (onboardingData.goal_type === "Quiero preparar una carrera lo mejor posible") {
      const formattedDate = onboardingData.race_date ? 
        format(new Date(onboardingData.race_date), "d 'de' MMMM 'de' yyyy", { locale: es }) :
        "fecha no especificada";
      
      const raceType = onboardingData.race_type || "Asfalto";
      return `Preparando un ${onboardingData.race_distance} (${raceType}) el ${formattedDate}`;
    }
    
    return "Sin objetivo específico";
  };

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Email</p>
        <p className="text-gray-900">{user?.email}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Próximo objetivo</p>
          <button
            onClick={() => setShowEditGoal(true)}
            className="text-sensa-purple hover:text-sensa-purple/80 flex items-center text-sm"
            aria-label="Editar objetivo"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </button>
        </div>
        <p className="text-gray-900">{formatGoal()}</p>
      </div>
      
      <EditGoalDialog
        isOpen={showEditGoal}
        onClose={() => setShowEditGoal(false)}
        userId={user?.id}
        currentGoalType={onboardingData?.goal_type || ""}
        currentRaceDistance={onboardingData?.race_distance}
        currentRaceDate={onboardingData?.race_date}
        currentRaceType={onboardingData?.race_type || "Asfalto"}
      />
    </>
  );
};

export default UserInfo;
