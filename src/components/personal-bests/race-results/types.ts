
import { z } from "zod";
import { Enums } from "@/integrations/supabase/types";

type PBRaceDistance = Enums<"pb_race_distance">;

// Track race types
export const trackTypes = ["Pista Cubierta", "Aire Libre"] as const;
export type TrackType = typeof trackTypes[number];

// Race surface types
export const surfaceTypes = ["Asfalto", "Pista de atletismo"] as const;
export type SurfaceType = typeof surfaceTypes[number];

// Track distances by type
export const trackDistances = {
  "Pista Cubierta": ["60m", "200m", "400m", "800m", "1500m", "Milla", "3000m"],
  "Aire Libre": ["100m", "200m", "400m", "800m", "1500m", "Milla", "3000m", "5000m", "10000m"]
};

// Map track distances to IAAF event names for scoring
export const trackDistanceToIAAFEvent = {
  "60m": "60m",
  "100m": "100m",
  "200m": "200m",
  "400m": "400m",
  "800m": "800m",
  "1500m": "1500m",
  "Milla": "Mile",
  "3000m": "3000m",
  "5000m": "5000m",
  "10000m": "10000m",
  // Indoor specific mappings
  "60m_indoor": "60m",
  "200m_indoor": "200m sh",
  "400m_indoor": "400m sh",
  "800m_indoor": "800m sh",
  "1500m_indoor": "1500m sh",
  "Milla_indoor": "Mile sh",
  "3000m_indoor": "3000m sh"
};

export interface RaceResult {
  id: string;
  race_date: string;
  distance: PBRaceDistance | string; // Extended to include track distances
  hours: number;
  minutes: number;
  seconds: number;
  surface_type?: SurfaceType;
  track_type?: TrackType;
}

export const RaceFormSchema = z.object({
  surfaceType: z.enum(surfaceTypes, {
    required_error: "Selecciona el tipo de superficie",
  }).default("Asfalto"),
  trackType: z.enum(trackTypes).optional(),
  distance: z.string({
    required_error: "Selecciona la distancia",
  }),
  raceDate: z.date({
    required_error: "Selecciona la fecha de la carrera",
  }),
  hours: z.number().min(0).max(99),
  minutes: z.number().min(0).max(59),
  seconds: z.number().min(0).max(59),
}).refine(data => {
  // At least one time unit must be greater than 0
  return data.hours > 0 || data.minutes > 0 || data.seconds > 0;
}, {
  message: "Debes ingresar un tiempo válido",
  path: ["minutes"],
});

export const raceFormSchema = RaceFormSchema;

export type RaceFormValues = z.infer<typeof RaceFormSchema>;
