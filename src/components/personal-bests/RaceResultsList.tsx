
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronRight, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ViewRaceResultsDialog from "./ViewRaceResultsDialog";
import { Enums } from "@/integrations/supabase/types";
import { calculateIAAFPoints } from "@/lib/iaaf-scoring-tables";

type PBRaceDistance = Enums<"pb_race_distance">;

// Helper function to convert database enum to display format
const formatDistanceForDisplay = (distance: PBRaceDistance): string => {
  if (distance === "5K" || distance === "10K") return distance;
  if (distance === "Half Marathon") return "Media maratón";
  if (distance === "Marathon") return "Maratón";
  return distance; // Fallback
};

interface RaceResult {
  id: string;
  race_date: string;
  distance: PBRaceDistance;
  hours: number;
  minutes: number;
  seconds: number;
  gender?: string;
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
  const [gender, setGender] = useState<'men' | 'women'>('men');
  const { toast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // First get the user's profile to determine gender
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const { data: profile } = await supabase
          .from('user_pb_profiles')
          .select('gender')
          .eq('user_id', user.id)
          .single();
          
        // Set gender for IAAF point calculation
        if (profile?.gender) {
          setGender(profile.gender.toLowerCase() === 'female' ? 'women' : 'men');
        }
        
        // Get race results
        const { data: results, error } = await supabase
          .from('race_results')
          .select('*')
          .order('race_date', { ascending: false });

        if (error) throw error;

        // Group by distance
        const distances = Array.from(new Set(results.map(r => formatDistanceForDisplay(r.distance))));
        
        const grouped = distances.map(displayDistance => {
          // Filter results for this display distance by matching with the DB enum value
          const distanceResults = results.filter(r => formatDistanceForDisplay(r.distance) === displayDistance);
          
          // Find PB (fastest time)
          const pb = [...distanceResults].sort((a, b) => {
            const aTime = a.hours * 3600 + a.minutes * 60 + a.seconds;
            const bTime = b.hours * 3600 + b.minutes * 60 + b.seconds;
            return aTime - bTime;
          })[0] || null;
          
          // Latest is already first since we ordered by date
          const latest = distanceResults[0] || null;
          
          return {
            distance: displayDistance,
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

  const getIAAFPoints = (result: RaceResult | null) => {
    if (!result) return 0;
    
    const origDistance = result.distance; // Convert from display format back to DB enum
    return calculateIAAFPoints(
      origDistance, 
      result.hours, 
      result.minutes, 
      result.seconds, 
      gender
    );
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
