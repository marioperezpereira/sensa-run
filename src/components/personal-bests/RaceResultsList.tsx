
import { useState } from "react";
import ViewRaceResultsDialog from "./ViewRaceResultsDialog";
import DistanceResultCard from "./race-results/DistanceResultCard";
import EmptyResultsState from "./race-results/EmptyResultsState";
import ResultsLoadingState from "./race-results/ResultsLoadingState";
import { useRaceResultsList } from "@/hooks/useRaceResultsList";

interface RaceResultsListProps {
  refreshTrigger?: number;
}

const RaceResultsList = ({ refreshTrigger = 0 }: RaceResultsListProps) => {
  const [viewDistance, setViewDistance] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  
  // Combine external and local refresh triggers
  const combinedRefreshTrigger = refreshTrigger + localRefreshTrigger;
  
  const { loading, resultsByDistance, getIAAFPoints } = useRaceResultsList(combinedRefreshTrigger);

  const handleViewResults = (distance: string) => {
    setViewDistance(distance);
    setShowViewDialog(true);
  };

  const handleResultsChange = () => {
    setLocalRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return <ResultsLoadingState />;
  }

  if (resultsByDistance.length === 0) {
    return <EmptyResultsState />;
  }

  // Group results by surface type
  const roadResults = resultsByDistance.filter(r => r.surfaceType === "Asfalto");
  const trackResults = resultsByDistance.filter(r => r.surfaceType === "Pista de atletismo");
  
  // Further group track results by type
  const outdoorResults = trackResults.filter(r => r.trackType === "Aire Libre");
  const indoorResults = trackResults.filter(r => r.trackType === "Pista Cubierta");

  return (
    <div className="space-y-6">
      {/* Road races */}
      {roadResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Asfalto</h2>
          <div className="space-y-4">
            {roadResults.map(({ distance, pb, latest, count, surfaceType, trackType }) => (
              <DistanceResultCard 
                key={`${distance}-${surfaceType}-${trackType}`}
                distance={distance}
                pb={pb}
                latest={latest}
                count={count}
                onViewAll={handleViewResults}
                getIAAFPoints={getIAAFPoints}
                surfaceType={surfaceType}
                trackType={trackType}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Track races - Outdoor */}
      {outdoorResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Pista de Atletismo - Aire Libre</h2>
          <div className="space-y-4">
            {outdoorResults.map(({ distance, pb, latest, count, surfaceType, trackType }) => (
              <DistanceResultCard 
                key={`${distance}-${surfaceType}-${trackType}`}
                distance={distance}
                pb={pb}
                latest={latest}
                count={count}
                onViewAll={handleViewResults}
                getIAAFPoints={getIAAFPoints}
                surfaceType={surfaceType}
                trackType={trackType}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Track races - Indoor */}
      {indoorResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Pista de Atletismo - Pista Cubierta</h2>
          <div className="space-y-4">
            {indoorResults.map(({ distance, pb, latest, count, surfaceType, trackType }) => (
              <DistanceResultCard 
                key={`${distance}-${surfaceType}-${trackType}`}
                distance={distance}
                pb={pb}
                latest={latest}
                count={count}
                onViewAll={handleViewResults}
                getIAAFPoints={getIAAFPoints}
                surfaceType={surfaceType}
                trackType={trackType}
              />
            ))}
          </div>
        </div>
      )}
      
      {viewDistance && (
        <ViewRaceResultsDialog 
          open={showViewDialog} 
          onOpenChange={setShowViewDialog} 
          distance={viewDistance}
          refreshTrigger={combinedRefreshTrigger}
          onResultsChange={handleResultsChange}
        />
      )}
    </div>
  );
};

export default RaceResultsList;
