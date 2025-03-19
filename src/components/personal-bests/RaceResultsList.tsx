
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ViewRaceResultsDialog from "./ViewRaceResultsDialog";

interface RaceResult {
  id: string;
  race_date: string;
  distance: string;
  hours: number;
  minutes: number;
  seconds: number;
}

interface ResultsByDistance {
  distance: string;
  pb: RaceResult | null;
  latest: RaceResult | null;
  count: number;
}

interface RaceResultsListProps {
  refreshTrigger?: number;
}

const RaceResultsList = ({ refreshTrigger = 0 }: RaceResultsListProps) => {
  const [loading, setLoading] = useState(true);
  const [resultsByDistance, setResultsByDistance] = useState<ResultsByDistance[]>([]);
  const [viewDistance, setViewDistance] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data: results, error } = await supabase
          .from('race_results')
          .select('*')
          .order('race_date', { ascending: false });

        if (error) throw error;

        // Group by distance
        const distances = Array.from(new Set(results.map(r => r.distance)));
        
        const grouped = distances.map(distance => {
          const distanceResults = results.filter(r => r.distance === distance);
          
          // Find PB (fastest time)
          const pb = [...distanceResults].sort((a, b) => {
            const aTime = a.hours * 3600 + a.minutes * 60 + a.seconds;
            const bTime = b.hours * 3600 + b.minutes * 60 + b.seconds;
            return aTime - bTime;
          })[0] || null;
          
          // Latest is already first since we ordered by date
          const latest = distanceResults[0] || null;
          
          return {
            distance,
            pb,
            latest,
            count: distanceResults.length
          };
        });
        
        setResultsByDistance(grouped);
      } catch (error) {
        console.error('Error fetching race results:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los resultados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [toast, refreshTrigger]);

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy", { locale: es });
  };

  const handleViewResults = (distance: string) => {
    setViewDistance(distance);
    setShowViewDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-pulse space-y-4 w-full">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 h-28 rounded-lg w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (resultsByDistance.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aún no tienes resultados registrados.</p>
        <p className="text-gray-500 text-sm mt-2">
          Utiliza el botón de "Nueva marca" para añadir tu primer resultado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resultsByDistance.map(({ distance, pb, latest, count }) => (
        <div key={distance} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">{distance}</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleViewResults(distance)}
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
                  <p className="font-semibold flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {formatTime(pb.hours, pb.minutes, pb.seconds)}
                  </p>
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
                  <p className="font-semibold flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
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
      ))}
      
      {viewDistance && (
        <ViewRaceResultsDialog 
          open={showViewDialog} 
          onOpenChange={setShowViewDialog} 
          distance={viewDistance}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
};

export default RaceResultsList;
