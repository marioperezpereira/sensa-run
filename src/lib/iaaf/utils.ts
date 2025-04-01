import { calculateIAAFPoints } from "./calculator";
import { RaceResult } from "@/components/personal-bests/race-results/types";

export const getIAAFPoints = (result: RaceResult | null, gender: 'men' | 'women'): number => {
  try {
    if (!result) return 0;
    
    // Determine if it's an indoor event
    const isIndoor = result.track_type === "Pista Cubierta";
    
    return calculateIAAFPoints(
      result.distance, 
      result.hours, 
      result.minutes, 
      result.seconds, 
      gender,
      isIndoor
    );
  } catch (error) {
    console.error('Error calculating IAAF points:', error);
    return 0;
  }
}; 