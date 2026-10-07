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

export const localityOptions = [
  "Residential",
  "Commercial",
  "Industrial",
] as const;

export const classOfLocality1Options = [
  "High",
  "Middle",
  "Poor",
] as const;

export const classOfLocality2Options = [
  "Urban",
  "Semi Urban",
  "Rural",
] as const;

export const classOfLocality3Options = [
  "Posh class",
  "Medium",
  "Ordinary",
] as const;

export const typeOfLandOptions = [
  "Freehold",
  "Leasehold",
] as const;

export const genuinenessOptions = [
  "Yes",
  "No",
  "NA",
] as const;

export const occupancyOptions = [
  "Self-occupied",
  "Rented",
  "Seller-Occupied",
  "Other",
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
  // General Section Fields (all optional)
  purposeOfValuation: z.string().optional(),
  documentsName1: z.string().optional(),
  documentsName2: z.string().optional(),
  documentsName3: z.string().optional(),
  nameOfOwner: z.string().optional(),
  address: z.string().optional(),
  configurationInShort: z.string().optional(),
  configurationFullDescription: z.string().optional(),
  locality: z.string().optional(),
  classOfLocality1: z.string().optional(),
  classOfLocality2: z.string().optional(),
  classOfLocality3: z.string().optional(),
  municipalCorporation: z.string().optional(),
  typeOfLand: z.string().optional(),
  genuinenessOrAuthenticity: z.string().optional(),
  anyOtherComments: z.string().optional(),
  nosOfFloor: z.string().optional(),
  nosOfStaircase: z.string().optional(),
  nosOfLifts: z.string().optional(),
});

export type CreateMakerValuationInput = z.infer<typeof createMakerValuationSchema>;
