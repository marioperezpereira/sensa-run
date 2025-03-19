
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Enums } from "@/integrations/supabase/types";

export type PBRaceDistance = Enums<"pb_race_distance">;

export interface RaceResult {
  id: string;
  race_date: string;
  distance: PBRaceDistance;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface ResultsByDistance {
  distance: string;
  pb: RaceResult | null;
  latest: RaceResult | null;
  count: number;
}

// Helper function to convert database enum to display format
export const formatDistanceForDisplay = (distance: PBRaceDistance): string => {
  if (distance === "5K" || distance === "10K") return distance;
  if (distance === "Half Marathon") return "Media maratón";
  if (distance === "Marathon") return "Maratón";
  return distance; // Fallback
};

// Helper function to convert display format to database enum
export const getDbDistanceFromDisplay = (displayDistance: string): PBRaceDistance => {
  if (displayDistance === "5K" || displayDistance === "10K") return displayDistance;
  if (displayDistance === "Media maratón") return "Half Marathon";
  if (displayDistance === "Maratón") return "Marathon";
  // Default fallback - should not happen with proper validation
  return "5K";
};

export const formatTime = (hours: number, minutes: number, seconds: number) => {
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString: string) => {
  return format(new Date(dateString), "d MMM yyyy", { locale: es });
};
