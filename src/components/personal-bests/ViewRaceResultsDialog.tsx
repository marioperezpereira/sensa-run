
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRaceResults } from "@/hooks/useRaceResults";
import ResultsManager from "./race-results/ResultsManager";
import ResultsLoadingState from "./race-results/ResultsLoadingState";

interface ViewRaceResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distance: string;
  refreshTrigger?: number;
}

const ViewRaceResultsDialog = ({ 
  open, 
  onOpenChange, 
  distance,
  refreshTrigger = 0 
}: ViewRaceResultsDialogProps) => {
  const { 
    loading, 
    results, 
    gender,
    deleteResult, 
    updateResultInState,
    getIAAFPoints
  } = useRaceResults(distance, refreshTrigger);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Resultados: {distance}</DialogTitle>
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
            updateResultInState={updateResultInState}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewRaceResultsDialog;
