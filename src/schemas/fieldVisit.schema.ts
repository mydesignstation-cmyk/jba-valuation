import { z } from "zod";

/** Zod schemas for the Field Visit form and server-side parsing. */

export const fieldVisitStatusSchema = z.enum(["DRAFT", "SUBMITTED"]);

/**
 * The minimal first-version Field Visit form. All four fields are required.
 * Shared between the client form (via zodResolver) and the server function
 * (re-validated with `.parse()` so the browser is never the only gatekeeper).
 */
export const fieldVisitFormSchema = z.object({
  floor: z.string().min(1, "Floor is required").trim().max(255, "Floor is too long"),
  building: z.string().min(1, "Building is required").trim().max(255, "Building is too long"),
  ageOfBuilding: z
    .string()
    .min(1, "Age of building is required")
    .trim()
    .max(255, "Age of building is too long"),
  sqFeet: z.string().min(1, "Sq. feet is required").trim().max(255, "Sq. feet is too long"),
});

export type FieldVisitFormValues = z.infer<typeof fieldVisitFormSchema>;
