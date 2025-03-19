
import { z } from "zod";

export interface RaceResult {
  id: string;
  race_date: string;
  distance: string;
  hours: number;
  minutes: number;
  seconds: number;
}

export const raceFormSchema = z.object({
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

export type RaceFormValues = z.infer<typeof raceFormSchema>;
