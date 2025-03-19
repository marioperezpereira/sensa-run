
import { DISTANCE_MAPPINGS } from './types';
import { iaafScoringTables } from './scoring-tables';

/**
 * Calculate IAAF points for a race result using table lookup with interpolation
 * 
 * @param distance - Race distance (e.g., "5K", "10K", "Half Marathon", "Marathon")
 * @param hours - Hours component of the time
 * @param minutes - Minutes component of the time
 * @param seconds - Seconds component of the time
 * @param gender - Gender ("men" or "women")
 * @returns - IAAF points as a number
 */
export const calculateIAAFPoints = (
  distance: string, 
  hours: number, 
  minutes: number, 
  seconds: number, 
  gender: 'men' | 'women'
): number => {
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  // Map the distance to the corresponding key in the scoring table
  const mappedDistance = DISTANCE_MAPPINGS[distance];
  if (!mappedDistance) {
    return 0; // Return 0 if the distance is not recognized
  }
  
  // Get the scoring entries for the gender and distance
  const scoringEntries = iaafScoringTables[gender][mappedDistance];
  if (!scoringEntries || scoringEntries.length === 0) {
    return 0; // Return 0 if scoring entries are not found
  }
  
  // If time is faster than the fastest time in the table, return the highest score
  if (totalSeconds <= scoringEntries[0].time) {
    return scoringEntries[0].score;
  }
  
  // If time is slower than the slowest time in the table, return the lowest score
  const lastEntry = scoringEntries[scoringEntries.length - 1];
  if (totalSeconds >= lastEntry.time) {
    return lastEntry.score;
  }
  
  // Find the two entries that bracket the given time
  for (let i = 0; i < scoringEntries.length - 1; i++) {
    const lowerEntry = scoringEntries[i];
    const upperEntry = scoringEntries[i + 1];
    
    if (totalSeconds >= lowerEntry.time && totalSeconds <= upperEntry.time) {
      // Linear interpolation to find the exact score
      const timeRange = upperEntry.time - lowerEntry.time;
      const scoreRange = upperEntry.score - lowerEntry.score;
      const timeOffset = totalSeconds - lowerEntry.time;
      
      // Calculate the interpolated score and round down
      return Math.floor(lowerEntry.score + (timeOffset / timeRange) * scoreRange);
    }
  }
  
  // This should not happen if the data is properly structured
  return 0;
};
