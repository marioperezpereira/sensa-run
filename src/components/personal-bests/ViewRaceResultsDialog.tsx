
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditRaceResultDialog from "./EditRaceResultDialog";
import RaceResultsTable from "./RaceResultsTable";
import RaceResultsLoadingState from "./RaceResultsLoadingState";
import RaceResultsEmptyState from "./RaceResultsEmptyState";
import { RaceResult, getDbDistanceFromDisplay } from "./utils/pb-utils";

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
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editResult, setEditResult] = useState<RaceResult | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchResults();
    }
  }, [open, distance, refreshTrigger]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('race_results')
        .select('*')
        .eq('distance', getDbDistanceFromDisplay(distance))
        .order('race_date', { ascending: false });

      if (error) throw error;
      setResults(data || []);
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

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from('race_results')
        .delete()
        .eq('id', deleteId);
      
      if (error) throw error;
      
      toast({
        title: "Resultado eliminado",
        description: "El resultado ha sido eliminado correctamente",
      });
      
      // Refresh the list
      setResults(results.filter(r => r.id !== deleteId));
    } catch (error) {
      console.error('Error deleting race result:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el resultado",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (result: RaceResult) => {
    setEditResult(result);
    setShowEditDialog(true);
  };

  const handleResultUpdated = (updatedResult: RaceResult) => {
    setResults(results.map(r => r.id === updatedResult.id ? updatedResult : r));
    setShowEditDialog(false);
    setEditResult(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Resultados: {distance}</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <RaceResultsLoadingState />
          ) : results.length === 0 ? (
            <RaceResultsEmptyState />
          ) : (
            <RaceResultsTable 
              results={results} 
              onEdit={handleEdit} 
              onDelete={handleDeleteClick}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar resultado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El resultado será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
