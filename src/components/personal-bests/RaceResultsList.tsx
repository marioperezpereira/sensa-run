
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
  
  const { loading, resultsByDistance, getIAAFPoints } = useRaceResultsList(refreshTrigger);

  const handleViewResults = (distance: string) => {
    setViewDistance(distance);
    setShowViewDialog(true);
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
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
};

export default RaceResultsList;
