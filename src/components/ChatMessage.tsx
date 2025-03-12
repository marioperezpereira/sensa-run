
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EffortRating } from "./EffortRating";
import { EnergyRating } from "./EnergyRating";
import { ConditionSelection } from "./ConditionSelection";
import { RatingStep } from "@/hooks/useRatingsFlow";

interface ChatMessageProps {
  content: string;
  isBot?: boolean;
  timestamp: string;
  currentStep?: RatingStep;
  activityId?: string;
  onRatingSubmitted?: () => void;
}

export const ChatMessage = ({ 
  content, 
  isBot = false, 
  timestamp,
  currentStep,
  activityId,
  onRatingSubmitted
}: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex w-full mb-4 animate-message-appear",
      isBot ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
        isBot ? "bg-white text-gray-800" : "bg-telegram-blue text-white"
      )}>
        <p className="text-sm md:text-base whitespace-pre-line">{content}</p>
        {currentStep === 'effort' && activityId && onRatingSubmitted && (
          <div className="mt-4">
            <EffortRating 
              activityId={activityId}
              onRatingSubmitted={onRatingSubmitted}
            />
          </div>
        )}
        {currentStep === 'energy' && onRatingSubmitted && (
          <div className="mt-4">
            <EnergyRating 
              onCompleted={onRatingSubmitted}
            />
          </div>
        )}
        {currentStep === 'condition' && onRatingSubmitted && (
          <div className="mt-4">
            <ConditionSelection 
              onCompleted={onRatingSubmitted}
            />
          </div>
        )}
        <p className={cn(
          "text-[10px] mt-1",
          isBot ? "text-gray-500" : "text-blue-100"
        )}>{timestamp}</p>
      </div>
    </div>
  );
};
