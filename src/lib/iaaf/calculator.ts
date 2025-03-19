
import { DISTANCE_MAPPINGS } from './types';
import { iaafCoefficients } from './coefficients';

/**
 * Calculate IAAF points for a race result using the quadratic formula approach
 * 
 * @param distance - Race distance (e.g., "5K", "10K", "Half Marathon", "Marathon")
 * @param hours - Hours component of the time
 * @param minutes - Minutes component of the time
 * @param seconds - Seconds component of the time
 * @param gender - Gender ("men" or "women")
 * @returns - IAAF points as a number (rounded down)
 */
export const calculateIAAFPoints = (
  distance: string, 
  hours: number, 
  minutes: number, 
  seconds: number, 
  gender: 'men' | 'women'
): number => {
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  // Map the distance to the corresponding key in the coefficients table
  const mappedDistance = DISTANCE_MAPPINGS[distance];
  if (!mappedDistance) {
    return 0; // Return 0 if the distance is not recognized
  }
  
  // Get the coefficients for the gender and distance
  const coefficients = iaafCoefficients[gender][mappedDistance];
  if (!coefficients) {
    return 0; // Return 0 if the coefficients are not found
  }
  
  // Apply the quadratic formula: points = a*t² + b*t + c
  // where t is the time in seconds, and a, b, c are the coefficients
  const { a, b, c } = coefficients;
  const points = a * Math.pow(totalSeconds, 2) + b * totalSeconds + c;
  
  // Ensure points are not negative and round down to nearest integer
  // As per IAAF standard, points are always rounded down
  return Math.max(0, Math.floor(points * 100));
};
