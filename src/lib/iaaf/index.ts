
// Export all IAAF-related functionality from a central location
export { calculateIAAFPoints, DISTANCE_MAPPINGS } from './calculator';
export { coefficients as waCoefficients } from './constants';

// Define types for IAAF coefficients
export interface IAFCoefficient {
  [key: string]: number[];
}

export interface CoefficientTable {
  men: IAFCoefficient;
  women: IAFCoefficient;
}
