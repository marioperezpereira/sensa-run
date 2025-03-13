
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UserInfoProps {
  user: User | null;
  onboardingData: any;
}

const UserInfo = ({ user, onboardingData }: UserInfoProps) => {
  const formatGoal = () => {
    if (!onboardingData) return "Cargando...";
    
    if (onboardingData.goal_type === "Quiero preparar una carrera lo mejor posible") {
      const formattedDate = onboardingData.race_date ? 
        format(new Date(onboardingData.race_date), "d 'de' MMMM 'de' yyyy", { locale: es }) :
        "fecha no especificada";
      return `Preparando un ${onboardingData.race_distance} el ${formattedDate}`;
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
        <p className="text-sm text-gray-500">Próximo objetivo</p>
        <p className="text-gray-900">{formatGoal()}</p>
      </div>
    </>
  );
};

export default UserInfo;
