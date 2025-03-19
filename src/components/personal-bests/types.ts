
import { z } from "zod";

export const formSchema = z.object({
  gender: z.enum(["Male", "Female"], {
    required_error: "Debes seleccionar el género",
  }),
  dateOfBirth: z.date({
    required_error: "Debes seleccionar la fecha de nacimiento",
  }),
});

export type ProfileFormValues = z.infer<typeof formSchema>;
