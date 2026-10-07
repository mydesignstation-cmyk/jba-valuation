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

export const boundaryMeasuredOptions = [
  "As per deed",
  "As per actuals",
] as const;

export const occupancyStatusOptions = [
  "Self-occupied",
  "Rented",
  "Seller-Occupied",
  "Other",
] as const;

export const qualityOptions = [
  "Good",
  "Average",
  "Poor",
] as const;

export const yesNoOptions = [
  "Yes",
  "No",
] as const;

export const typeOfStructureOptions = [
  "RCC, Load Bearing, Mixed",
] as const;

export const buildingTypeOptions = [
  "Residential",
  "Commercial",
  "Residential Cum Commercial",
  "Industrial or other",
] as const;

export const openCoveredParkingOptions = [
  "Open",
  "Covered",
] as const;

export const marketabilityOptions = [
  "Good",
  "Average",
  "Poor",
] as const;

export const areaBasisOptions = [
  "CA",
  "RERA CA",
  "BUA",
  "SBUA",
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
  documentsDetails1: z.string().optional(),
  documentsName2: z.string().optional(),
  documentsDetails2: z.string().optional(),
  documentsName3: z.string().optional(),
  documentsDetails3: z.string().optional(),
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
  // Boundaries Section
  boundaryPropertyNorth: z.string().optional(),
  boundaryPropertySouth: z.string().optional(),
  boundaryPropertyEast: z.string().optional(),
  boundaryPropertyWest: z.string().optional(),
  boundaryPropertyMeasured: z.string().optional(),
  boundarySiteNorth: z.string().optional(),
  boundarySiteSouth: z.string().optional(),
  boundarySiteEast: z.string().optional(),
  boundarySiteWest: z.string().optional(),
  boundarySiteMeasured: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  occupancy: z.string().optional(),
  // Apartment Section
  yearOfConstruction: z.string().optional(),
  ageOfBuilding: z.string().optional(),
  residualLife: z.string().optional(),
  typeOfStructure: z.string().optional(),
  nosOfUnitPerFloor: z.string().optional(),
  buildingType: z.string().optional(),
  appearance: z.string().optional(),
  qualityOfConstruction: z.string().optional(),
  maintenance: z.string().optional(),
  protectedWaterSupply: z.string().optional(),
  undergroundSewerage: z.string().optional(),
  nosOfParking: z.string().optional(),
  compoundWall: z.string().optional(),
  openCoveredParking: z.string().optional(),
  pavementLaidAroundBuilding: z.string().optional(),
  // Flat Section
  flooring: z.string().optional(),
  doors: z.string().optional(),
  windows: z.string().optional(),
  fittings: z.string().optional(),
  finishing: z.string().optional(),
  assessmentNo: z.string().optional(),
  taxAmount: z.string().optional(),
  taxPaidInNameOf: z.string().optional(),
  electricityServiceConnectionNo: z.string().optional(),
  meterCardInNameOf: z.string().optional(),
  meterCardDated: z.string().optional(),
  undividedAreaOfLand: z.string().optional(),
  // Marketability Section
  marketability: z.string().optional(),
  positiveFactors: z.string().optional(),
  negativeFactors: z.string().optional(),
  // Area Calculation Section
  physicalMeasuredArea: z.string().optional(),
  physicalMeasuredAreaBasis: z.string().optional(),
  documentedArea: z.string().optional(),
  documentedAreaBasis: z.string().optional(),
  approvedPlanArea: z.string().optional(),
  approvedPlanAreaBasis: z.string().optional(),
  builtUpArea: z.string().optional(),
  builtUpAreaBasis: z.string().optional(),
  adoptedArea: z.string().optional(),
  adoptedAreaBasis: z.string().optional(),
  floorSpaceIndex: z.string().optional(),
});

export type CreateMakerValuationInput = z.infer<typeof createMakerValuationSchema>;
