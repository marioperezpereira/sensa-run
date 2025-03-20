
import { z } from "zod";

export interface RaceResult {
  id: string;
  race_date: string;
  distance: string;
  hours: number;
  minutes: number;
  seconds: number;
}

export const RaceFormSchema = z.object({
  distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"], {
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
