
/**
 * Type definitions for IAAF scoring tables
 */

export type IAFScoringEntry = {
  time: number;  // time in seconds
  score: number;
};

export type ScoringTable = {
  men: {
    [distance: string]: IAFScoringEntry[];
  };
  women: {
    [distance: string]: IAFScoringEntry[];
  };
};

// Constants for recognized distances - these MUST match the keys in the scoring data
export const DISTANCE_MAPPINGS: { [key: string]: string } = {
  "5K": "track5000",
  "10K": "road10000",
  "Half Marathon": "roadHalfMarathon",
  "Marathon": "roadMarathon"
};
