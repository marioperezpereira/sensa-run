
import { Trophy, ArrowDown } from "lucide-react";

const EmptyRaceResults = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="w-16 h-16 bg-sensa-purple/10 rounded-full flex items-center justify-center mb-4">
        <Trophy className="h-8 w-8 text-sensa-purple" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay resultados todavía</h3>
      <p className="text-gray-500 text-center max-w-md mb-4">
        Registra tus tiempos de carrera para comenzar a seguir tu progreso.
      </p>
      <div className="flex items-center text-sensa-purple text-sm font-medium">
        <span>Usa el botón "Nueva marca"</span>
        <ArrowDown className="h-4 w-4 ml-1 animate-bounce" />
      </div>
    </div>
  );
};

export default EmptyRaceResults;
