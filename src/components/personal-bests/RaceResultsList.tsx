
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ViewRaceResultsDialog from "./ViewRaceResultsDialog";
import RaceResultsListSkeleton from "./RaceResultsListSkeleton";
import EmptyRaceResults from "./EmptyRaceResults";
import DistanceCard from "./DistanceCard";
import { 
  RaceResult, 
  ResultsByDistance, 
  formatDistanceForDisplay 
} from "./utils/pb-utils";

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

  const handleViewResults = (distance: string) => {
    setViewDistance(distance);
    setShowViewDialog(true);
  };

  if (loading) {
    return <RaceResultsListSkeleton />;
  }

  if (resultsByDistance.length === 0) {
    return <EmptyRaceResults />;
  }

  return (
    <div className="space-y-4">
      {resultsByDistance.map((distanceData) => (
        <DistanceCard 
          key={distanceData.distance} 
          distanceData={distanceData} 
          onViewAllClick={handleViewResults} 
        />
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
