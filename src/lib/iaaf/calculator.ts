
import { DISTANCE_MAPPINGS } from './types';
import { iaafScoringTables } from './scoring-tables';

/**
 * Calculate IAAF points for a race result
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
  
  // Map the distance to the corresponding key in the scoring table
  const mappedDistance = DISTANCE_MAPPINGS[distance];
  if (!mappedDistance) {
    return 0; // Return 0 if the distance is not recognized
  }
  
  // Get the scoring table for the gender and distance
  const scoringTable = iaafScoringTables[gender][mappedDistance];
  if (!scoringTable) {
    return 0; // Return 0 if the scoring table is not found
  }
  
  // Find the points by comparing the time with the scoring table entries
  // If the time is less than the fastest time in the table, return the highest score
  if (totalSeconds <= scoringTable[0].time) {
    return scoringTable[0].score;
  }
  
  // If the time is greater than the slowest time in the table, calculate points below 500
  const lastIndex = scoringTable.length - 1;
  if (totalSeconds >= scoringTable[lastIndex].time) {
    // Calculate how many seconds over the slowest time in the table
    const secondsOver = totalSeconds - scoringTable[lastIndex].time;
    
    // Calculate the rate of decline based on the last two entries in the table
    const secondLastIndex = lastIndex - 1;
    const timeDiff = scoringTable[lastIndex].time - scoringTable[secondLastIndex].time;
    const scoreDiff = scoringTable[secondLastIndex].score - scoringTable[lastIndex].score;
    const pointsPerSecond = scoreDiff / timeDiff;
    
    // Apply the same rate of decline to calculate points below 500
    const calculatedPoints = Math.max(0, scoringTable[lastIndex].score - (secondsOver * pointsPerSecond));
    
    return Math.floor(calculatedPoints); // Round down to be conservative
  }
  
  // Find the two entries that bracket the time and interpolate
  for (let i = 0; i < scoringTable.length - 1; i++) {
    if (totalSeconds >= scoringTable[i].time && totalSeconds < scoringTable[i + 1].time) {
      // Linear interpolation between the two scores
      const lowerTime = scoringTable[i].time;
      const upperTime = scoringTable[i + 1].time;
      const lowerScore = scoringTable[i].score;
      const upperScore = scoringTable[i + 1].score;
      
      // Calculate the interpolated score
      const ratio = (totalSeconds - lowerTime) / (upperTime - lowerTime);
      const interpolatedScore = lowerScore - ratio * (lowerScore - upperScore);
      
      return Math.floor(interpolatedScore); // Round down to be conservative
    }
  }
  
  return 0; // Fallback (should not reach here)
};
