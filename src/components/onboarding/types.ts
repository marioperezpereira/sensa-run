
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
  race_distance?: "5K" | "10K" | "Media maratón" | "Maratón";
  race_date?: string;
  additional_info?: string;
  strava_profile?: string;
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

export const raceOptions = ["5K", "10K", "Media maratón", "Maratón"] as const;
