
import ReactMarkdown from 'react-markdown';
import { RecommendationFeedback } from "../RecommendationFeedback";

interface RecommendationDisplayProps {
  recommendation: string;
  showFeedback: boolean;
  error: string | null;
}

export const RecommendationDisplay = ({ 
  recommendation, 
  showFeedback, 
  error 
}: RecommendationDisplayProps) => {
  if (error) {
    return (
      <div className="text-center text-red-500">{error}</div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h3: ({children}) => <h3 className="text-2xl font-bold mb-4 text-sensa-purple">{children}</h3>,
          hr: () => <hr className="my-4" />
        }}
      >
        {recommendation}
      </ReactMarkdown>
      {showFeedback && (
      <RecommendationFeedback onFeedbackProvided={() => showFeedback = false} />
      )}
    </div>
  );
};
