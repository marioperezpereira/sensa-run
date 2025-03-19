
import { useState } from "react";
import { RaceResult } from "./types";
import ResultsTable from "./ResultsTable";
import ResultsPagination from "./ResultsPagination";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import EditRaceResultDialog from "../EditRaceResultDialog";
import { usePagination } from "@/hooks/usePagination";

interface ResultsManagerProps {
  results: RaceResult[];
  loading: boolean;
  gender: 'men' | 'women';
  getIAAFPoints: (result: RaceResult) => number;
  deleteResult: (id: string) => Promise<boolean>;
  updateResultInState: (updatedResult: RaceResult) => void;
}

const ResultsManager = ({
  results,
  loading,
  gender,
  getIAAFPoints,
  deleteResult,
  updateResultInState
}: ResultsManagerProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editResult, setEditResult] = useState<RaceResult | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Initialize pagination
  const { 
    currentPage, 
    totalPages, 
    goToPage, 
    getPaginatedItems 
  } = usePagination({ 
    totalItems: results.length,
    itemsPerPage: 5,
    initialPage: 1
  });
  
  // Get current page results
  const currentResults = getPaginatedItems(results);

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
      {results.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No hay resultados para mostrar</p>
      ) : (
        <>
          <ResultsTable 
            results={currentResults}
            onEdit={handleEdit}
            onDelete={handleDelete}
            gender={gender}
            getIAAFPoints={getIAAFPoints}
          />
          
          <ResultsPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </>
      )}
      
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

export default ResultsManager;
