
import {
  coefficients,
  eventNames,
  isEventValidForGender,
  markTypes,
  order,
  units,
} from "./constants";

const DISTANCE_MAPPINGS: { [key: string]: string } = {
  "5K": "Road 5 km",
  "10K": "Road 10 km",
  "Half Marathon": "Road HM",
  "Marathon": "Road Marathon"
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
 * @returns - World Athletics points as a number, rounded to nearest integer
 */
export const calculateIAAFPoints = (
  distance: string, 
  hours: number, 
  minutes: number, 
  seconds: number, 
  gender: 'men' | 'women'
): number => {
  try {
    // Validate inputs
    if (!distance || hours < 0 || minutes < 0 || seconds < 0) {
      console.warn("Invalid input parameters for IAAF calculation");
      return 0;
    }
    
    // Map the distance to the event name used in the coefficients object
    const eventName = DISTANCE_MAPPINGS[distance];
    if (!eventName) {
      console.warn(`Unknown distance mapping: ${distance}`);
      return 0;
    }
    
    // Convert time to seconds
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    
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
};

// Export the DISTANCE_MAPPINGS for use in other parts of the application
export { DISTANCE_MAPPINGS };

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

function getMarkFromScore(coefficients, y) {
  let ret = Number(
    (
      (-1 * coefficients[1] -
        Math.sqrt(
          Math.pow(coefficients[1], 2) -
            4 * coefficients[0] * (coefficients[2] - y)
        )) /
      (2 * coefficients[0])
    ).toFixed(2)
  );

  // find the positive result
  if (ret < 0) {
    ret = Number(
      (
        (-1 * coefficients[1] +
          Math.sqrt(
            Math.pow(coefficients[1], 2) -
              4 * coefficients[0] * (coefficients[2] - y)
          )) /
        (2 * coefficients[0])
      ).toFixed(2)
    );
  }

  return ret;
}

function userMarkToMark(userMark, markType) {
  switch (markType) {
    case "time":
      const [seconds, minutes, hours] = userMark
        .split(":")
        .reverse()
        .map(x => parseFloat(x));
      return 60 * 60 * (hours ?? 0) + 60 * (minutes ?? 0) + seconds;
    case "distance":
      return parseFloat(userMark);
    case "points":
      return parseInt(userMark);
    default:
      throw new Error(`unknown mark type ${markType}`);
  }
}

function zeroPad(num, places) {
  return String(num).padStart(places, "0");
}

function markToUserMark(mark, markType) {
  switch (markType) {
    case "time":
      const hours = Math.floor(mark / 60 / 60);
      const minutes = Math.floor(mark / 60) % 60;
      const seconds = Math.floor(mark % 60);
      const ms = (mark % 1).toFixed(2).split(".")[1];

      if (hours > 0) {
        return `${hours}:${zeroPad(minutes, 2)}:${zeroPad(seconds, 2)}.${ms}`;
      }
      if (minutes > 0) {
        return `${minutes}:${zeroPad(seconds, 2)}.${ms}`;
      }

      return `${seconds}.${ms}`;
    case "distance":
      return `${mark}`;
    case "points":
      return `${mark}`;
    default:
      throw new Error(`unknown mark type ${markType}`);
  }
}
