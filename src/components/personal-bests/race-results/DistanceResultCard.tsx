
import { formatDistanceToKm, formatTime } from "@/lib/utils";
import { RaceResult } from "./types";
import { ChevronRight, Medal, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DistanceResultCardProps {
  distance: string;
  pb: RaceResult | null;
  latest: RaceResult | null;
  count: number;
  onViewAll: (distance: string) => void;
  getIAAFPoints: (result: RaceResult | null) => number;
  surfaceType?: string;
  trackType?: string;
}

const DistanceResultCard = ({ 
  distance, 
  pb, 
  latest, 
  count, 
  onViewAll,
  getIAAFPoints,
  surfaceType = "Asfalto",
  trackType
}: DistanceResultCardProps) => {
  const formattedDistance = distance;
  const iaafPoints = pb ? getIAAFPoints(pb) : 0;
  
  // Format title based on surface and track type
  let title = formattedDistance;
  if (surfaceType === "Pista de atletismo" && trackType) {
    title = `${formattedDistance} (${trackType})`;
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {count > 0 && <p className="text-sm text-gray-500">{count} {count === 1 ? 'resultado' : 'resultados'}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onViewAll(distance)}>
          Ver todos <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>

      {count > 0 ? (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PB Card */}
          <div className="bg-amber-50 rounded-md p-3">
            <div className="flex items-center mb-2">
              <Medal className="h-5 w-5 text-amber-500 mr-2" />
              <span className="font-medium text-amber-700">Mejor Marca</span>
            </div>
            {pb && (
              <>
                <div className="text-lg font-semibold">{formatTime(pb.hours, pb.minutes, pb.seconds)}</div>
                <div className="text-sm text-gray-600 flex justify-between mt-1">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {new Date(pb.race_date).toLocaleDateString('es-ES')}
                  </span>
                  {iaafPoints > 0 && (
                    <span className="text-amber-600 font-medium">{Math.round(iaafPoints)} pts</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Latest Card */}
          <div className="bg-gray-50 rounded-md p-3">
            <div className="mb-2 font-medium text-gray-700">Último resultado</div>
            {latest && (
              <>
                <div className="text-lg font-semibold">{formatTime(latest.hours, latest.minutes, latest.seconds)}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {new Date(latest.race_date).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center py-6 bg-gray-50 rounded-md">
          <p className="text-gray-500">No hay resultados para esta distancia</p>
        </div>
      )}
    </Card>
  );
};

export default DistanceResultCard;
