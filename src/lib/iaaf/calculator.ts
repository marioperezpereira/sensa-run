import {
  coefficients,
  eventNames,
  isEventValidForGender,
  markTypes,
  order,
  units,
} from "./constants";
import { timeToSeconds } from "@/lib/utils";

const DISTANCE_MAPPINGS: { [key: string]: string } = {
  // Road races
  "5K": "Road 5 km",
  "10K": "Road 10 km",
  "Half Marathon": "Road HM",
  "Marathon": "Road Marathon",
  
  // Track races (outdoor)
  "100m": "100m",
  "200m": "200m",
  "400m": "400m",
  "800m": "800m",
  "1500m": "1500m",
  "Milla": "Mile",
  "3000m": "3000m",
  "5000m": "5000m",
  "10000m": "10000m",
  
  // Track races (indoor)
  "60m": "60m",
};

// Generate indoor-specific mappings
const INDOOR_SUFFIX_MAPPINGS: { [key: string]: string } = {
  "200m": "200m sh",
  "400m": "400m sh",
  "800m": "800m sh",
  "1500m": "1500m sh",
  "Milla": "Mile sh",
  "3000m": "3000m sh",
};

/**
 * Calculate World Athletics (formerly IAAF) points using the quadratic formula
 * 
 * Formula: points = a*t² + b*t + c
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
 * @param isIndoor - Whether the event is indoor (for track events)
 * @returns - World Athletics points as a number, rounded to nearest integer
 */
export function calculateIAAFPoints(
  distance: string,
  hours: number,
  minutes: number,
  seconds: number,
  gender: "M" | "F" = "M",
  isIndoor: boolean = false
): number {
  try {
    // Validate inputs
    if (!distance || hours < 0 || minutes < 0 || seconds < 0) {
      console.warn("Invalid input parameters for IAAF calculation");
      return 0;
    }
    
    // Map the distance to the event name used in the coefficients object
    let eventName = DISTANCE_MAPPINGS[distance];
    
    // For indoor track events (except 60m which is already mapped correctly)
    if (isIndoor && distance !== "60m" && INDOOR_SUFFIX_MAPPINGS[distance]) {
      eventName = INDOOR_SUFFIX_MAPPINGS[distance];
    }
    
    if (!eventName) {
      console.warn(`Unknown distance mapping: ${distance} (Indoor: ${isIndoor})`);
      return 0;
    }
    
    // Convert time to seconds
    const totalSeconds = timeToSeconds(hours, minutes, seconds);
    
    // Get the coefficients for this event and gender
    const eventCoefficients = coefficients[gender]?.[eventName];
    if (!eventCoefficients || !Array.isArray(eventCoefficients)) {
      console.warn(`No coefficients found for ${gender} ${eventName}`);
      return 0;
    }
    
    // Calculate the score
    return score(eventCoefficients, totalSeconds);
  } catch (error) {
    console.error("Error calculating IAAF points:", error);
    return 0;
  }
}

// Export the DISTANCE_MAPPINGS for use in other parts of the application
export { DISTANCE_MAPPINGS, INDOOR_SUFFIX_MAPPINGS };

function score(coefficients, x) {
  if (!coefficients || !Array.isArray(coefficients)) {
    return 0;
  }
  
  if (coefficients.length === 2) {
    return coefficients[0] * x + coefficients[1];
  }
  return Math.round(
    coefficients[0] * x * x + coefficients[1] * x + coefficients[2]
  );
}
