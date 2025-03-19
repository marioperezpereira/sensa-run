
import { FileX } from "lucide-react";

const RaceResultsEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <FileX className="h-6 w-6 text-gray-500" />
      </div>
      <p className="text-center text-gray-500">No hay resultados para mostrar</p>
    </div>
  );
};

export default RaceResultsEmptyState;
