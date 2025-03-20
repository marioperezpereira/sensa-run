
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RaceResult } from "./race-results/types";
import EditRaceForm from "./race-results/EditRaceForm";

interface EditRaceResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: RaceResult;
  onResultUpdated: (updatedResult: RaceResult) => void;
}

const EditRaceResultDialog = ({ 
  open, 
  onOpenChange, 
  result, 
  onResultUpdated 
}: EditRaceResultDialogProps) => {
  const handleResultUpdated = (updatedResult: RaceResult) => {
    onResultUpdated(updatedResult);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar resultado: {result.distance}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Modifica los datos de tu marca personal
          </DialogDescription>
        </DialogHeader>
        
        <EditRaceForm 
          result={result} 
          onResultUpdated={handleResultUpdated}
          onCancel={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditRaceResultDialog;
