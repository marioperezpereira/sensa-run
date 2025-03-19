
import React from "react";

const RaceResultsLoadingState = () => {
  return (
    <div className="flex justify-center p-8">
      <div className="animate-pulse space-y-4 w-full">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 h-10 rounded w-full"></div>
        ))}
      </div>
    </div>
  );
};

export default RaceResultsLoadingState;
