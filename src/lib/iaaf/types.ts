
/**
 * Type definitions for IAAF scoring
 */

// Constants for recognized distances
export const DISTANCE_MAPPINGS: { [key: string]: string } = {
  "5K": "track5000",
  "10K": "road10000",
  "Half Marathon": "roadHalfMarathon",
  "Marathon": "roadMarathon"
};

// Coefficient interface for the quadratic formula
export interface IAFCoefficient {
  a: number;
  b: number;
  c: number;
}

// Gender-specific coefficient tables
export interface CoefficientTable {
  men: {
    [distance: string]: IAFCoefficient;
  };
  women: {
    [distance: string]: IAFCoefficient;
  };
}
