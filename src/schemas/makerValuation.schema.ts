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

export const localityOptions = ["Residential", "Commercial", "Industrial"] as const;

export const classOfLocality1Options = ["High", "Middle", "Poor"] as const;

export const classOfLocality2Options = ["Urban", "Semi Urban", "Rural"] as const;

export const classOfLocality3Options = ["Posh class", "Medium", "Ordinary"] as const;

export const typeOfLandOptions = ["Freehold", "Leasehold"] as const;

export const genuinenessOptions = ["Yes", "No", "NA"] as const;

export const occupancyOptions = ["Self-occupied", "Rented", "Seller-Occupied", "Other"] as const;

export const boundaryMeasuredOptions = ["As per deed", "As per actuals"] as const;

export const occupancyStatusOptions = [
  "Self-occupied",
  "Rented",
  "Seller-Occupied",
  "Other",
] as const;

export const qualityOptions = ["Good", "Average", "Poor"] as const;

export const yesNoOptions = ["Yes", "No"] as const;

export const typeOfStructureOptions = ["RCC, Load Bearing, Mixed"] as const;

export const buildingTypeOptions = [
  "Residential",
  "Commercial",
  "Residential Cum Commercial",
  "Industrial or other",
] as const;

export const openCoveredParkingOptions = ["Open", "Covered"] as const;

export const marketabilityOptions = ["Good", "Average", "Poor"] as const;

export const areaBasisOptions = ["CA", "RERA CA", "BUA", "SBUA"] as const;

export const createMakerValuationSchema = z.object({
  caseId: z.string().min(1, "Case ID is required"),
  // Basic Details
  dateOfValuation: z.string().min(1, "Date of Valuation is required"),
  dateOfInspection: z.string().min(1, "Date of Inspection is required"),
  refNo: z.string().min(1, "Ref. No. is required"),
  branch: z.string().min(1, "Branch is required"),
  bankName: z.string().min(1, "Bank Name is required"),
  // Additional Fields (all optional)
  purchaserName: z.string().min(1, "This field is required"),
  typeOfProperty: z.string().min(1, "This field is required"),
  flatNo: z.string().min(1, "This field is required"),
  locatedOnFloor: z.string().min(1, "This field is required"),
  wing: z.string().min(1, "This field is required"),
  buildingName: z.string().min(1, "This field is required"),
  landmark: z.string().min(1, "This field is required"),
  roadNameArea: z.string().min(1, "This field is required"),
  location: z.string().min(1, "This field is required"),
  plotNo: z.string().min(1, "This field is required"),
  ctsNo: z.string().min(1, "This field is required"),
  sNo: z.string().min(1, "This field is required"),
  other: z.string().min(1, "This field is required"),
  village: z.string().min(1, "This field is required"),
  wardNo: z.string().min(1, "This field is required"),
  taluka: z.string().min(1, "This field is required"),
  blockNo: z.string().min(1, "This field is required"),
  district: z.string().min(1, "This field is required"),
  pinCode: z.string().min(1, "This field is required"),
  // General Section Fields (all optional)
  purposeOfValuation: z.string().min(1, "This field is required"),
  documentsName1: z.string().min(1, "This field is required"),
  documentsDetails1: z.string().min(1, "This field is required"),
  documentsName2: z.string().min(1, "This field is required"),
  documentsDetails2: z.string().min(1, "This field is required"),
  documentsName3: z.string().min(1, "This field is required"),
  documentsDetails3: z.string().min(1, "This field is required"),
  nameOfOwner: z.string().min(1, "This field is required"),
  address: z.string().min(1, "This field is required"),
  configurationInShort: z.string().min(1, "This field is required"),
  configurationFullDescription: z.string().min(1, "This field is required"),
  locality: z.string().min(1, "This field is required"),
  classOfLocality1: z.string().min(1, "This field is required"),
  classOfLocality2: z.string().min(1, "This field is required"),
  classOfLocality3: z.string().min(1, "This field is required"),
  municipalCorporation: z.string().min(1, "This field is required"),
  typeOfLand: z.string().min(1, "This field is required"),
  genuinenessOrAuthenticity: z.string().min(1, "This field is required"),
  anyOtherComments: z.string().min(1, "This field is required"),
  nosOfFloor: z.string().min(1, "This field is required"),
  nosOfStaircase: z.string().min(1, "This field is required"),
  nosOfLifts: z.string().min(1, "This field is required"),
  // Boundaries Section
  boundaryPropertyNorth: z.string().min(1, "This field is required"),
  boundaryPropertySouth: z.string().min(1, "This field is required"),
  boundaryPropertyEast: z.string().min(1, "This field is required"),
  boundaryPropertyWest: z.string().min(1, "This field is required"),
  boundaryPropertyMeasured: z.string().min(1, "This field is required"),
  boundarySiteNorth: z.string().min(1, "This field is required"),
  boundarySiteSouth: z.string().min(1, "This field is required"),
  boundarySiteEast: z.string().min(1, "This field is required"),
  boundarySiteWest: z.string().min(1, "This field is required"),
  boundarySiteMeasured: z.string().min(1, "This field is required"),
  latitude: z.string().min(1, "This field is required"),
  longitude: z.string().min(1, "This field is required"),
  occupancy: z.string().min(1, "This field is required"),
  // Apartment Section
  yearOfConstruction: z.string().min(1, "This field is required"),
  ageOfBuilding: z.string().min(1, "This field is required"),
  residualLife: z.string().min(1, "This field is required"),
  typeOfStructure: z.string().min(1, "This field is required"),
  nosOfUnitPerFloor: z.string().min(1, "This field is required"),
  buildingType: z.string().min(1, "This field is required"),
  appearance: z.string().min(1, "This field is required"),
  qualityOfConstruction: z.string().min(1, "This field is required"),
  maintenance: z.string().min(1, "This field is required"),
  protectedWaterSupply: z.string().min(1, "This field is required"),
  undergroundSewerage: z.string().min(1, "This field is required"),
  nosOfParking: z.string().min(1, "This field is required"),
  compoundWall: z.string().min(1, "This field is required"),
  openCoveredParking: z.string().min(1, "This field is required"),
  pavementLaidAroundBuilding: z.string().min(1, "This field is required"),
  // Flat Section
  flooring: z.string().min(1, "This field is required"),
  doors: z.string().min(1, "This field is required"),
  windows: z.string().min(1, "This field is required"),
  fittings: z.string().min(1, "This field is required"),
  finishing: z.string().min(1, "This field is required"),
  assessmentNo: z.string().min(1, "This field is required"),
  taxAmount: z.string().min(1, "This field is required"),
  taxPaidInNameOf: z.string().min(1, "This field is required"),
  electricityServiceConnectionNo: z.string().min(1, "This field is required"),
  meterCardInNameOf: z.string().min(1, "This field is required"),
  meterCardDated: z.string().min(1, "This field is required"),
  undividedAreaOfLand: z.string().min(1, "This field is required"),
  // Marketability Section
  marketability: z.string().min(1, "This field is required"),
  positiveFactors: z.string().min(1, "This field is required"),
  negativeFactors: z.string().min(1, "This field is required"),
  // Area Calculation Section
  physicalMeasuredArea: z.string().min(1, "This field is required"),
  physicalMeasuredAreaBasis: z.string().min(1, "This field is required"),
  documentedArea: z.string().min(1, "This field is required"),
  documentedAreaBasis: z.string().min(1, "This field is required"),
  approvedPlanArea: z.string().min(1, "This field is required"),
  approvedPlanAreaBasis: z.string().min(1, "This field is required"),
  builtUpArea: z.string().min(1, "This field is required"),
  builtUpAreaBasis: z.string().min(1, "This field is required"),
  adoptedArea: z.string().min(1, "This field is required"),
  adoptedAreaBasis: z.string().min(1, "This field is required"),
  floorSpaceIndex: z.string().min(1, "This field is required"),
  // Rate Section
  rateRange: z.string().min(1, "This field is required"),
  adoptedRate: z.string().min(1, "This field is required"),
  buildingRate: z.string().min(1, "This field is required"),
  landRate: z.string().min(1, "This field is required"),
  insuranceValue: z.string().optional(),
  // Details of Valuation Section
  marketValue: z.string().optional(),
  carParkingValue: z.string().min(1, "This field is required"),
  fairMarketValue: z.string().optional(),
  realizableValue: z.string().optional(),
  distressValue: z.string().optional(),
  govtReadyReckonerRatePerSqMtr: z.string().min(1, "This field is required"),
  govtReadyReckonerRatePerSqFt: z.string().min(1, "This field is required"),
  govtValue: z.string().optional(),
  rentRangePerMonth: z.string().min(1, "This field is required"),
  // Remarks Section
  remarks: z.string().min(1, "This field is required"),
});

export type CreateMakerValuationInput = z.infer<typeof createMakerValuationSchema>;
