
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface ResetExperienceButtonProps {
  onClick: () => void;
}

const ResetExperienceButton = ({ onClick }: ResetExperienceButtonProps) => {
  return (
    <Button 
      variant="outline" 
      className="w-full rounded-[42px] border-sensa-purple text-sensa-purple hover:bg-sensa-purple/10"
      onClick={onClick}
    >
      <RefreshCcw className="mr-2 h-4 w-4" />
      Personalizar experiencia
    </Button>
  );
};

export default ResetExperienceButton;
