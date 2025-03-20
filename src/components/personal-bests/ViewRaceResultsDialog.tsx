
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRaceResults } from "@/hooks/useRaceResults";
import { RaceResult } from "./race-results/types";
import ResultsManager from "./race-results/ResultsManager";
import ResultsLoadingState from "./race-results/ResultsLoadingState";

interface ViewRaceResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distance: string;
  refreshTrigger?: number;
  onResultsChange?: () => void;
}

const ViewRaceResultsDialog = ({ 
  open, 
  onOpenChange, 
  distance,
  refreshTrigger = 0,
  onResultsChange
}: ViewRaceResultsDialogProps) => {
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  
  // Combine external and local refresh triggers
  const combinedRefreshTrigger = refreshTrigger + localRefreshTrigger;
  
  const { 
    loading, 
    results, 
    gender,
    deleteResult, 
    updateResultInState,
    getIAAFPoints
  } = useRaceResults(distance, combinedRefreshTrigger);

  const handleResultUpdated = (updatedResult: RaceResult) => {
    updateResultInState(updatedResult);
    setLocalRefreshTrigger(prev => prev + 1);
    if (onResultsChange) {
      onResultsChange();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Resultados: {distance}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Historial de tiempos para esta distancia
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <ResultsLoadingState />
        ) : (
          <ResultsManager
            results={results}
            loading={loading}
            gender={gender}
            getIAAFPoints={getIAAFPoints}
            deleteResult={deleteResult}
            updateResultInState={handleResultUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewRaceResultsDialog;
