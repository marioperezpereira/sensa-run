
export type OnboardingStep = 
  | "experience"
  | "frequency"
  | "goal"
  | "race-target"
  | "race-date"
  | "additional-info"
  | "strava";

export type OnboardingData = {
  running_experience: string;
  weekly_frequency: string;
  goal_type: string;
  race_distance?: string;
  race_date?: string;
  additional_info?: string;
  strava_profile?: string;
  race_type?: string; // New field for track or road race type
};

export const experienceOptions = [
  "Menos de un año",
  "Entre uno y tres años",
  "Entre tres y cinco años",
  "Más de cinco años"
] as const;

export const frequencyOptions = [
  "Una o ninguna",
  "Dos o tres veces",
  "Cuatro o cinco veces",
  "Seis o siete veces"
] as const;

export const goalOptions = [
  "No tengo ningún objetivo claro, sólo quiero ponerme en forma",
  "Quiero preparar una carrera lo mejor posible"
] as const;

// Race type options (road or track)
export const raceTypeOptions = ["Asfalto", "Pista Cubierta", "Aire Libre"] as const;
export type RaceType = typeof raceTypeOptions[number];

// Road distances
export const roadDistances = ["5K", "10K", "Media maratón", "Maratón"] as const;

// Track distances by type
export const trackDistances = {
  "Pista Cubierta": ["60m", "200m", "400m", "800m", "1500m", "Milla", "3000m"],
  "Aire Libre": ["100m", "200m", "400m", "800m", "1500m", "Milla", "3000m", "5000m", "10000m"]
};

// All available distances based on race type
export const getDistancesByRaceType = (raceType: RaceType | undefined): string[] => {
  if (!raceType) return [];
  if (raceType === "Asfalto") return roadDistances as unknown as string[];
  return trackDistances[raceType as "Pista Cubierta" | "Aire Libre"] || [];
};
