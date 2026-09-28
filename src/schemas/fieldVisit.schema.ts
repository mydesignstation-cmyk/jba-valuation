import { z } from "zod";

/**
 * Zod schemas for the multi-step Field Visit Report.
 *
 * Two audiences share these schemas:
 *  - the client wizard (per-step resolvers give step-by-step validation), and
 *  - the server (`fieldVisitFormSchema.parse()` re-validates the whole payload
 *    so the browser is never the only gatekeeper).
 *
 * Auto-filled fields (case number, bank, customer, address, engineer name,
 * date of visit) are NOT part of this schema — they are derived server-side
 * from the Case and the authenticated user, never trusted from the client.
 * The only device-captured values the client sends are the GPS coordinates,
 * which are COMPULSORY.
 */

export const fieldVisitStatusSchema = z.enum(["DRAFT", "SUBMITTED"]);

// --- Enumerated option sets (single source of truth for UI + validation) ---

export const relationshipOptions = ["Owner", "Tenant", "Banker", "Agent", "Other"] as const;
export const propertyTypeOptions = ["Flat", "House", "Bungalow", "Land", "Commercial"] as const;
export const localityTypeOptions = ["Good", "Average", "Poor"] as const;
export const occupancyStatusOptions = ["Occupied", "Vacant", "Under Construction"] as const;
export const structureTypeOptions = ["RCC", "Brick", "Wood", "Mixed"] as const;
export const approachRoadOptions = ["Good", "Average", "Poor", "No Access"] as const;

export const relationshipSchema = z.enum(relationshipOptions);
export const propertyTypeSchema = z.enum(propertyTypeOptions);
export const localityTypeSchema = z.enum(localityTypeOptions);
export const occupancyStatusSchema = z.enum(occupancyStatusOptions);
export const structureTypeSchema = z.enum(structureTypeOptions);
export const approachRoadSchema = z.enum(approachRoadOptions);

// --- Reusable field helpers ---

/** A trimmed, required free-text field with a friendly message and max length. */
const requiredText = (label: string, max = 1000) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`);

/** An optional trimmed free-text field (empty string allowed, coerced to ""). */
const optionalText = (max = 2000) =>
  z.string().trim().max(max, "This value is too long").optional().or(z.literal(""));

/**
 * A required numeric string. The form uses text inputs, so numeric values
 * arrive as strings; we validate they parse to a finite number in range.
 * Kept as a string end-to-end so it maps cleanly onto Drizzle `numeric`
 * columns (which round-trip as strings) without float precision surprises.
 */
const numericString = (label: string, opts: { min?: number; max?: number } = {}) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => Number.isFinite(Number(v)), `${label} must be a number`)
    .refine((v) => opts.min === undefined || Number(v) >= opts.min, `${label} is too low`)
    .refine((v) => opts.max === undefined || Number(v) <= opts.max, `${label} is too high`);

/** A required integer string (whole number, non-negative by default). */
const integerString = (label: string, opts: { min?: number; max?: number } = {}) => {
  const min = opts.min ?? 0;
  return z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => /^-?\d+$/.test(v), `${label} must be a whole number`)
    .refine((v) => Number(v) >= min, `${label} is too low`)
    .refine((v) => opts.max === undefined || Number(v) <= opts.max, `${label} is too high`);
};

/** A required percentage string (0–100, decimals allowed). */
const percentString = (label: string) => numericString(label, { min: 0, max: 100 });

// --- GPS (device-captured, compulsory) ---

export const gpsSchema = z.object({
  gpsLatitude: z
    .number({
      required_error: "GPS location is required",
      invalid_type_error: "GPS latitude is invalid",
    })
    .min(-90, "Latitude out of range")
    .max(90, "Latitude out of range"),
  gpsLongitude: z
    .number({
      required_error: "GPS location is required",
      invalid_type_error: "GPS longitude is invalid",
    })
    .min(-180, "Longitude out of range")
    .max(180, "Longitude out of range"),
});

// --- Per-step schemas ---

/** STEP 1 — Visit details (GPS is captured here and is compulsory). */
export const step1Schema = z
  .object({
    personMet: requiredText("Name of person met", 255),
    personPhone: requiredText("Phone number", 50).refine(
      (v) => /^[0-9+\-()\s]{6,20}$/.test(v),
      "Enter a valid phone number",
    ),
    relationship: relationshipSchema,
  })
  .merge(gpsSchema);

/** STEP 2 — Property details. */
export const step2Schema = z.object({
  landmark: requiredText("Landmark", 500),
  propertyType: propertyTypeSchema,
  localityType: localityTypeSchema,
  occupancyStatus: occupancyStatusSchema,
});

/** STEP 3 — Building information. */
export const step3Schema = z.object({
  structureType: structureTypeSchema,
  occupancyLevel: percentString("Occupancy level"),
  floorsInBuilding: integerString("No. of floors in building", { min: 0 }),
  locatedOnFloor: requiredText("Located on floor no.", 100),
  flatsOnFloor: integerString("No. of flats on the floor", { min: 0 }),
  wingsInBuilding: integerString("No. of wings in building", { min: 0 }),
  liftsStaircases: integerString("No. of lifts/staircases", { min: 0 }),
});

/**
 * STEP 4 — Construction details.
 *
 * Year of construction is kept (it exists in the actual report) and is NOT
 * replaced by age of building. Construction stage is a percentage. When the
 * property is not "Under Construction" a completed build is implied, so we
 * default the stage to "100" client-side rather than forcing manual entry —
 * but the column is never silently dropped.
 */
const currentYear = new Date().getFullYear();
export const step4Schema = z.object({
  yearOfConstruction: integerString("Year of construction", {
    min: 1800,
    max: currentYear,
  }),
  constructionStage: percentString("Construction stage"),
  workDescription: optionalText(2000),
});

/** STEP 5 — Property boundaries (all required). */
export const step5Schema = z.object({
  boundaryEast: requiredText("Boundary — East", 500),
  boundaryWest: requiredText("Boundary — West", 500),
  boundaryNorth: requiredText("Boundary — North", 500),
  boundarySouth: requiredText("Boundary — South", 500),
});

/** STEP 6 — Assessment details. */
export const step6Schema = z.object({
  approachRoadCondition: approachRoadSchema,
  areaSqFt: numericString("Area of property", { min: 0 }),
  ratePerSqFt: numericString("Rate per sq. ft.", { min: 0 }),
  negativePoints: optionalText(2000),
  agentOpinion: optionalText(2000),
});

/** STEP 7 — Final remarks (optional; GPS is re-confirmed in the UI). */
export const step7Schema = z.object({
  finalRemarks: optionalText(2000),
});

/**
 * The complete Field Visit Report payload sent on final submission.
 * Composed from every step schema so the client and server validate the
 * exact same shape. The original first-version fields (floor, building,
 * ageOfBuilding, sqFeet) are preserved so the existing DB columns and the
 * working submission behaviour continue to be populated.
 */
export const fieldVisitFormSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema)
  .merge(step7Schema);

export type FieldVisitFormValues = z.infer<typeof fieldVisitFormSchema>;

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
export type Step4Values = z.infer<typeof step4Schema>;
export type Step5Values = z.infer<typeof step5Schema>;
export type Step6Values = z.infer<typeof step6Schema>;
export type Step7Values = z.infer<typeof step7Schema>;
