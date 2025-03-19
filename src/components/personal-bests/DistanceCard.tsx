
import { Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultsByDistance, formatTime, formatDate } from "./utils/pb-utils";

interface DistanceCardProps {
  distanceData: ResultsByDistance;
  onViewAllClick: (distance: string) => void;
}

const DistanceCard = ({ distanceData, onViewAllClick }: DistanceCardProps) => {
  const { distance, pb, latest, count } = distanceData;
  
  return (
    <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">{distance}</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onViewAllClick(distance)}
          className="text-xs text-sensa-purple hover:bg-sensa-purple/10"
        >
          Ver todos ({count}) <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best time */}
        <div className="bg-amber-50/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Mejor tiempo</p>
          {pb ? (
            <>
              <p className="font-semibold flex items-center">
                <Clock className="mr-1 h-4 w-4 text-amber-500" />
                {formatTime(pb.hours, pb.minutes, pb.seconds)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(pb.race_date)}</p>
            </>
          ) : (
            <p className="text-sm italic text-gray-400">No hay datos</p>
          )}
        </div>
        
        {/* Latest */}
        <div className="bg-sensa-purple/10 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Última carrera</p>
          {latest ? (
            <>
              <p className="font-semibold flex items-center">
                <Clock className="mr-1 h-4 w-4 text-sensa-purple" />
                {formatTime(latest.hours, latest.minutes, latest.seconds)}
              </p>
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

export default DistanceCard;
