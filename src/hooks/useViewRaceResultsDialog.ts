
import { useState } from "react";
import { useRaceResults } from "./useRaceResults";

export const useViewRaceResultsDialog = (distance: string, refreshTrigger = 0) => {
  const [open, setOpen] = useState(false);
  
  const {
    loading,
    results,
    gender,
    deleteResult,
    updateResultInState,
    getIAAFPoints
  } = useRaceResults(distance, refreshTrigger);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  return {
    open,
    setOpen,
    handleOpenChange,
    resultsData: {
      loading,
      results,
      gender,
      deleteResult,
      updateResultInState,
      getIAAFPoints
    }
  };
};
