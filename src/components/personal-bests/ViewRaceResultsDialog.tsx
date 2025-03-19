import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
import { RaceResult } from "./race-results/types";

// Import the enum type from types
import { Enums } from "@/integrations/supabase/types";
type PBRaceDistance = Enums<"pb_race_distance">;

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

  // Convert string distance to PBRaceDistance enum
  const getPBDistance = (dist: string): PBRaceDistance => {
    if (dist === "5K" || dist === "10K") return dist;
    if (dist === "Media maratón") return "Half Marathon";
    if (dist === "Maratón") return "Marathon";
    // Default fallback - should not happen with proper validation
    return "5K";
  };

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
        .eq('distance', getPBDistance(distance))
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

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy", { locale: es });
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
                  <div key={i} className="bg-gray-200 h-10 rounded w-full"></div>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay resultados para mostrar</p>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>{formatDate(result.race_date)}</TableCell>
                      <TableCell>
                        <span className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-gray-500" />
                          {formatTime(result.hours, result.minutes, result.seconds)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(result)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteId(result.id);
                            setShowDeleteDialog(true);
                          }}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
