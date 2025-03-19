
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RaceResult } from "./types";

interface DistanceResultCardProps {
  distance: string;
  pb: RaceResult | null;
  latest: RaceResult | null;
  count: number;
  onViewAll: (distance: string) => void;
  getIAAFPoints: (result: RaceResult | null) => number;
}

const DistanceResultCard = ({
  distance,
  pb,
  latest,
  count,
  onViewAll,
  getIAAFPoints,
}: DistanceResultCardProps) => {
  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy", { locale: es });
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">{distance}</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onViewAll(distance)}
          className="text-xs"
        >
          Ver todos ({count}) <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best time */}
        <div className="bg-[#FEF7CD]/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Mejor tiempo</p>
          {pb ? (
            <>
              <div className="flex justify-between items-center">
                <p className="font-semibold flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {formatTime(pb.hours, pb.minutes, pb.seconds)}
                </p>
                <div className="flex items-center bg-amber-100 text-amber-800 font-medium px-2 py-1 rounded-full text-xs">
                  <Award className="mr-1 h-3 w-3" />
                  {getIAAFPoints(pb)} pts
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{formatDate(pb.race_date)}</p>
            </>
          ) : (
            <p className="text-sm italic text-gray-400">No hay datos</p>
          )}
        </div>
        
        {/* Latest */}
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Última carrera</p>
          {latest ? (
            <>
              <div className="flex justify-between items-center">
                <p className="font-semibold flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {formatTime(latest.hours, latest.minutes, latest.seconds)}
                </p>
                <div className="flex items-center bg-gray-200 text-gray-700 font-medium px-2 py-1 rounded-full text-xs">
                  <Award className="mr-1 h-3 w-3" />
                  {getIAAFPoints(latest)} pts
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{formatDate(latest.race_date)}</p>
            </>
          ) : (
            <p className="text-sm italic text-gray-400">No hay datos</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistanceResultCard;
