
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

  return (
    <div className="space-y-4">
      {resultsByDistance.map(({ distance, pb, latest, count }) => (
        <DistanceResultCard 
          key={distance}
          distance={distance}
          pb={pb}
          latest={latest}
          count={count}
          onViewAll={handleViewResults}
          getIAAFPoints={getIAAFPoints}
        />
      ))}
      
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
