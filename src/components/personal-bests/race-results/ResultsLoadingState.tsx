
import { Skeleton } from "@/components/ui/skeleton";

const ResultsLoadingState = () => {
  return (
    <div className="flex justify-center p-8">
      <div className="animate-pulse space-y-4 w-full">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
};

export default ResultsLoadingState;
