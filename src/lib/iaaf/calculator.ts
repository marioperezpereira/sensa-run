
import { DISTANCE_MAPPINGS } from './types';
import { waCoefficients } from './coefficients';

/**
 * Calculate World Athletics (formerly IAAF) points using the quadratic formula
 * 
 * Formula: points = 1000 * e^(a*t² + b*t + c)
 * Where:
 * - t is the time in seconds
 * - a, b, c are the coefficients for the specific event
 * 
 * Reference: https://jeffchen.dev/posts/Calculating-World-Athletics-Coefficients/
 * 
 * @param distance - Race distance (e.g., "5K", "10K", "Half Marathon", "Marathon")
 * @param hours - Hours component of the time
 * @param minutes - Minutes component of the time
 * @param seconds - Seconds component of the time
 * @param gender - Gender ("men" or "women")
 * @returns - World Athletics points as a number, rounded to nearest integer
 */
export const calculateIAAFPoints = (
  distance: string, 
  hours: number, 
  minutes: number, 
  seconds: number, 
  gender: 'men' | 'women'
): number => {
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  // Map the distance to the corresponding key in the coefficient table
  const mappedDistance = DISTANCE_MAPPINGS[distance];
  if (!mappedDistance) {
    return 0; // Return 0 if the distance is not recognized
  }
  
  // Get the coefficients for the gender and distance
  const coefficients = waCoefficients[gender][mappedDistance];
  if (!coefficients) {
    return 0; // Return 0 if coefficients are not found
  }
  
  // Apply the quadratic formula: 1000 * e^(a*t² + b*t + c)
  const { a, b, c } = coefficients;
  const exponent = (a * Math.pow(totalSeconds, 2)) + (b * totalSeconds) + c;
  const points = 1000 * Math.exp(exponent);
  
  // World Athletics points are always rounded to the nearest integer
  return Math.round(points);
};
