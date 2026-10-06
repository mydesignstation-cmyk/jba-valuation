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
export const propertyTypeOptions = [
  "Industrial",
  "Godown",
  "Row House",
  "Bungalow",
  "Commercial Shop",
  "Commercial Office",
  "Penthouse",
  "Duplex",
  "Residential Flat",
  "Other",
] as const;

export const structureTypeOptions = [
  "RCC",
  "Brick",
  "Wood",
  "Mixed",
  "Load Bearing",
  "Other",
] as const;
export const localityTypeOptions = ["Good", "Average", "Poor"] as const;
export const occupancyStatusOptions = ["Seller", "Rented", "Purchaser", "Owner", "Other"] as const;

export const approachRoadOptions = ["Good", "Average", "Poor", "No Access"] as const;
export const rateBasisOptions = [
  "Carpet Area",
  "Built Up Area",
  "Super Built Up Area",
  "RERA Carpet Area",
  "Lumpsum Rate",
  "Floorwise Rate",
] as const;
export const areaBasisOptions = [
  "CA",
  "RERA CA",
  "BUA",
  "SBUA",
] as const;

export const relationshipSchema = z.enum(relationshipOptions);
export const propertyTypeSchema = z.enum(propertyTypeOptions);
export const localityTypeSchema = z.enum(localityTypeOptions);
export const occupancyStatusSchema = z.enum(occupancyStatusOptions);
export const structureTypeSchema = z.enum(structureTypeOptions);
export const approachRoadSchema = z.enum(approachRoadOptions);
export const rateBasisSchema = z.enum(rateBasisOptions);
export const areaBasisSchema = z.enum(areaBasisOptions);

// --- Reusable field helpers ---

/** A trimmed, required free-text field with a friendly message and max length. */
const requiredText = (label: string, max = 1000, min = 1) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, min > 1 ? `${label} must be at least ${min} characters` : `${label} is required`)
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
    personMet: requiredText("Name of person met", 255, 3),
    personPhone: requiredText("Phone number", 10).refine(
      (v) => /^\d{10}$/.test(v),
      "Enter a valid 10-digit phone number",
    ),
    relationship: relationshipSchema,
    otherRelationship: z.string().optional(),
    relationshipRemarks: z.string().optional(), // Remarks for any relationship type
  })
  .merge(gpsSchema)
  .refine(
    (data) =>
      data.relationship !== "Other" || (data.otherRelationship && data.otherRelationship.trim()),
    {
      message: "Other relationship is required when selecting 'Other'",
      path: ["otherRelationship"],
    },
  );

/** STEP 2 — Property details. */
export const step2Schema = z
  .object({
    fullAddress: requiredText("Full Address", 1000),
    landmark: requiredText("Landmark", 500, 3),
    propertyType: propertyTypeSchema,
    propertyTypeRemarks: optionalText(500), // Remarks if "Other" selected
    localityType: localityTypeSchema,
    occupancyStatus: occupancyStatusSchema,
    occupancyStatusRemarks: optionalText(500), // Remarks if "Other" selected
    occupancyWithName: requiredText("Occupancy with Name of Occupant", 500),
    yearOfLiving: requiredText("Year of living", 100), // Year of living — STEP 2
  })
  .refine(
    (data) =>
      data.propertyType !== "Other" ||
      (data.propertyTypeRemarks && data.propertyTypeRemarks.trim()),
    {
      message: "Property type remarks are required when selecting 'Other'",
      path: ["propertyTypeRemarks"],
    },
  )
  .refine(
    (data) =>
      data.occupancyStatus !== "Other" ||
      (data.occupancyStatusRemarks && data.occupancyStatusRemarks.trim()),
    {
      message: "Occupancy status remarks are required when selecting 'Other'",
      path: ["occupancyStatusRemarks"],
    },
  );

/**
 * STEP 3 — Building information.
 *
 * All counts are numeric (whole numbers). An internal cross-field rule enforces
 * that the floor the property sits on cannot exceed the number of floors in the
 * building — a common data-entry mistake worth catching before submission.
 */
const step3Shape = {
  structureType: structureTypeSchema,
  structureTypeRemarks: optionalText(500), // Remarks if "Other" selected
  occupancyLevel: requiredText("Occupancy level", 100), // Made required
  floorsInBuilding: requiredText("No. of floors", 100), // Made required
  locatedOnFloor: requiredText("Located on floor", 100), // Made required
  flatsOnFloor: requiredText("No. of flats on floor", 100), // Made required
  wingsInBuilding: requiredText("No. of wings", 100), // Made required
  liftsStaircases: requiredText("No. of lifts/staircases", 100), // Made required
};

/**
 * Cross-field rule shared by the per-step and full schemas: the floor the
 * property sits on cannot exceed the number of floors in the building.
 */
const refineLocatedFloor = (
  val: { floorsInBuilding: string; locatedOnFloor: string },
  ctx: z.RefinementCtx,
) => {
  const floors = Number(val.floorsInBuilding);
  const located = Number(val.locatedOnFloor);
  if (
    val.floorsInBuilding !== "" &&
    val.locatedOnFloor !== "" &&
    Number.isFinite(floors) &&
    Number.isFinite(located) &&
    located > floors
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["locatedOnFloor"],
      message: "Located floor cannot be more than the number of floors in the building",
    });
  }
};

export const step3Schema = z.object(step3Shape);

/**
 * STEP 4 — Construction details.
 *
 * Year of construction is kept (it exists in the actual report) and is NOT
 * replaced by age of building. Construction stage is now an open text field.
 * Added new open text fields for construction details.
 */
const currentYear = new Date().getFullYear();
export const step4Schema = z.object({
  yearOfConstruction: integerString("Year of construction", {
    min: 1800,
    max: currentYear,
  }),
  constructionStage: requiredText("Construction stage", 100), // Made required
  workDescription: requiredText("Work description", 2000), // Made required
  flatIdentification: requiredText("Flat identification", 500), // Made required
  plotDemarcation: requiredText("Plot demarcation", 500), // Made required
  noOfLabor: requiredText("No. of labor", 100), // Made required
  materialAtSite: requiredText("Material at site", 500), // Made required
});

/** STEP 5 — Property boundaries (all required). */
export const step5Schema = z.object({
  boundaryEast: requiredText("Boundary — East", 500),
  boundaryWest: requiredText("Boundary — West", 500),
  boundaryNorth: requiredText("Boundary — North", 500),
  boundarySouth: requiredText("Boundary — South", 500),
});

/** STEP 6 — Assessment details. */
export const step6Schema = z
  .object({
    approachRoadCondition: approachRoadSchema,
    widthOfApproachRoad: requiredText("Width of approach road", 500), // Made required
    remarksApproachRoad: requiredText("Remarks on approach road", 500), // Made required
    societyNameBoard: requiredText("Name on society notice board", 500), // Made required, label updated
    areaSqFt: numericString("Area of property", { min: 0 }), // Made required, must be numeric
    areaBasis: areaBasisSchema, // Area type (CA, RERA CA, BUA, SBUA)
    rateBasis: optionalText(100), // Rate basis
    ratePerSqFt: requiredText("Rate per sq. ft.", 100), // Accepts numbers and letters
    rentPerMonth: requiredText("Rent per month", 100), // Rent per month
    negativePoints: requiredText("Negative points", 2000), // Made required
    agentOpinion: requiredText("Agent opinion", 2000), // Made required
  })
  .refine(
    (data) =>
      data.approachRoadCondition !== "No Access" ||
      (data.remarksApproachRoad && data.remarksApproachRoad.trim()),
    {
      message: "Remarks are required when approach road is 'No Access'",
      path: ["remarksApproachRoad"],
    },
  );

/** STEP 7 — Final remarks (compulsory). */
export const step7Schema = z.object({
  finalRemarks: requiredText("Final remarks", 2000),
});

/**
 * The complete Field Visit Report payload sent on final submission.
 * Composed from every step schema so the client and server validate the
 * exact same shape. The original first-version fields (floor, building,
 * ageOfBuilding, sqFeet) are preserved so the existing DB columns and the
 * working submission behaviour continue to be populated.
 */
export const fieldVisitFormSchema = step1Schema
  .and(step2Schema)
  .and(z.object(step3Shape))
  .and(step4Schema)
  .and(step5Schema)
  .and(step6Schema)
  .and(step7Schema);

export type FieldVisitFormValues = z.infer<typeof fieldVisitFormSchema>;

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
export type Step4Values = z.infer<typeof step4Schema>;
export type Step5Values = z.infer<typeof step5Schema>;
export type Step6Values = z.infer<typeof step6Schema>;
export type Step7Values = z.infer<typeof step7Schema>;
