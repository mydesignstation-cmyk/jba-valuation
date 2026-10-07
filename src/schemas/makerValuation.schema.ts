import { z } from "zod";

export const typeOfPropertyOptions = [
  "Residential Flat",
  "Commercial office",
  "Commercial Shop",
  "Industrial Unit",
  "Godown",
  "Land & Building",
  "Others",
] as const;

export const createMakerValuationSchema = z.object({
  caseId: z.string().min(1, "Case ID is required"),
  // Basic Details
  dateOfValuation: z.string().min(1, "Date of Valuation is required"),
  dateOfInspection: z.string().min(1, "Date of Inspection is required"),
  refNo: z.string().min(1, "Ref. No. is required"),
  branch: z.string().min(1, "Branch is required"),
  bankName: z.string().min(1, "Bank Name is required"),
  // Additional Fields (all optional)
  purchaserName: z.string().optional(),
  typeOfProperty: z.string().optional(),
  flatNo: z.string().optional(),
  locatedOnFloor: z.string().optional(),
  wing: z.string().optional(),
  buildingName: z.string().optional(),
  landmark: z.string().optional(),
  roadNameArea: z.string().optional(),
  location: z.string().optional(),
  plotNo: z.string().optional(),
  ctsNo: z.string().optional(),
  sNo: z.string().optional(),
  other: z.string().optional(),
  village: z.string().optional(),
  wardNo: z.string().optional(),
  taluka: z.string().optional(),
  blockNo: z.string().optional(),
  district: z.string().optional(),
  pinCode: z.string().optional(),
});

export type CreateMakerValuationInput = z.infer<typeof createMakerValuationSchema>;
