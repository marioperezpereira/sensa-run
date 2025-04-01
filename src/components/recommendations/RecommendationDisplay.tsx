import { type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { RecommendationFeedback } from "../RecommendationFeedback";

interface RecommendationDisplayProps {
  recommendation: string;
  showFeedback: boolean;
  error: string | null;
}

export function RecommendationDisplay({ 
  recommendation, 
  showFeedback, 
  error 
}: RecommendationDisplayProps): JSX.Element {
  if (error) {
    return (
      <div className="text-center text-red-500">{error}</div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h3: ({children}: {children: ReactNode}) => (
            <h3 className="text-2xl font-bold mt-8 mb-4 text-sensa-purple">{children}</h3>
          ),
          hr: () => <hr className="my-6" />,
          p: ({children}: {children: ReactNode}) => (
            <p className="mb-4 leading-relaxed text-center">{children}</p>
          )
        }}
      >
        {recommendation}
      </ReactMarkdown>
      {showFeedback && (
        <RecommendationFeedback onFeedbackProvided={() => showFeedback = false} />
      )}
    </div>
  );
}
