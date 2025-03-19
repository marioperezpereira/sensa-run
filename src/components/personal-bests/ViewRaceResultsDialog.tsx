
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useRaceResults } from "@/hooks/useRaceResults";
import ResultsTable from "./race-results/ResultsTable";
import DeleteConfirmationDialog from "./race-results/DeleteConfirmationDialog";
import EditRaceResultDialog from "./EditRaceResultDialog";
import { RaceResult } from "./race-results/types";

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editResult, setEditResult] = useState<RaceResult | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { 
    loading, 
    results, 
    gender,
    deleteResult, 
    updateResultInState,
    getIAAFPoints
  } = useRaceResults(distance, refreshTrigger);

  const handleEdit = (result: RaceResult) => {
    setEditResult(result);
    setShowEditDialog(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteResult(deleteId);
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const handleResultUpdated = (updatedResult: RaceResult) => {
    updateResultInState(updatedResult);
    setShowEditDialog(false);
    setEditResult(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Resultados: {distance}</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse space-y-4 w-full">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay resultados para mostrar</p>
          ) : (
            <ResultsTable 
              results={results}
              onEdit={handleEdit}
              onDelete={handleDelete}
              gender={gender}
              getIAAFPoints={getIAAFPoints}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
      />
      
      {/* Edit dialog */}
      {editResult && (
        <EditRaceResultDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          result={editResult}
          onResultUpdated={handleResultUpdated}
        />
      )}
    </>
  );
};

export default ViewRaceResultsDialog;
