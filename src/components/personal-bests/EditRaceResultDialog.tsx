
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar resultado: {result.distance}</DialogTitle>
        </DialogHeader>
        
        <EditRaceForm 
          result={result} 
          onResultUpdated={onResultUpdated} 
          onCancel={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditRaceResultDialog;
