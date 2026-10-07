/**
 * Central domain types for the valuation case-management app.
 * Aligned with docs/domain-foundation.md.
 */

export type Role = "SUPER_ADMIN" | "ADMIN" | "SITE_ENGINEER" | "MAKER" | "CHECKER" | "UPLOADER";

export type CaseStage =
  | "CREATED"
  | "ASSIGNED"
  | "FIELD_VISIT_PENDING"
  | "FIELD_VISIT_SUBMITTED"
  // Set when a Checker assigns a Maker to a case whose field visit is submitted.
  | "MAKER_ASSIGNED"
  | "MAKER_PENDING"
  | "MAKER_COMPLETED"
  | "CHECKER_PENDING"
  | "CHECKER_COMPLETED"
  | "UPLOADER_PENDING"
  | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email?: string;
  address: string;
  alternativeContactPersonName?: string;
  alternativePhoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bank {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValuationCase {
  id: string;
  /** Internally generated, e.g. VAL-2026-0001. */
  caseNumber: string;
  /** Manually entered by Admin: external bank/customer request reference. */
  requestNumber: string;
  customerId: string;
  bankId: string;
  branchId: string;
  assignedEngineerId: string;
  /** Neon Auth UUID of the Maker assigned by a Checker. Empty when unassigned. */
  assignedMakerId: string;
  /** Neon Auth UUID of the Checker who assigned the Maker. Empty when unassigned. */
  assignedByCheckerId: string;
  /** Neon Auth UUID of the Checker/admin who submitted the case to the Uploader. Empty until then. */
  checkedById: string;
  /** Neon Auth UUID of the Uploader/admin who marked the upload completed. Empty until then. */
  uploadedById: string;
  stage: CaseStage;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type FieldVisitStatus = "DRAFT" | "SUBMITTED";

export interface FieldVisit {
  id: string;
  caseId: string;
  /** Neon Auth UUID of the site engineer who owns this visit. */
  engineerId: string;

  // Original first-version fields (retained for the existing working flow).
  floor: string;
  building: string;
  ageOfBuilding: string;
  sqFeet: string;

  // Device-captured (auto). Present on expanded reports; optional because
  // rows created by the basic version won't have them.
  visitDate?: string;
  gpsLatitude?: string;
  gpsLongitude?: string;

  // STEP 1 — Visit details
  personMet?: string;
  personPhone?: string;
  relationship?: string;
  otherRelationship?: string; // When relationship is "Other"
  relationshipRemarks?: string; // Remarks for any relationship type

  // STEP 2 — Property details
  landmark?: string;
  propertyType?: string;
  propertyTypeRemarks?: string; // Remarks if "Other"
  localityType?: string;
  occupancyStatus?: string;
  occupancyStatusRemarks?: string; // Remarks if "Other"
  occupancyWithName?: string; // Name of occupant
  yearOfLiving?: string; // Year of living — STEP 2
  fullAddress?: string; // Full Address as per site — STEP 2

  // STEP 3 — Building information
  structureType?: string;
  structureTypeRemarks?: string; // Remarks if "Other"
  occupancyLevel?: string;
  floorsInBuilding?: string;
  locatedOnFloor?: string;
  flatsOnFloor?: string;
  wingsInBuilding?: string;
  liftsStaircases?: string;

  // STEP 4 — Construction details
  yearOfConstruction?: number;
  constructionStage?: string;
  workDescription?: string;
  flatIdentification?: string;
  plotDemarcation?: string;
  noOfLabor?: string;
  materialAtSite?: string;

  // STEP 5 — Property boundaries
  boundaryEast?: string;
  boundaryWest?: string;
  boundaryNorth?: string;
  boundarySouth?: string;

  // STEP 6 — Assessment details
  approachRoadCondition?: string;
  widthOfApproachRoad?: string;
  remarksApproachRoad?: string;
  societyNameBoard?: string;
  areaSqFt?: string;
  areaBasis?: string; // Area basis (CA, RERA CA, BUA, SBUA) — STEP 6
  rateBasis?: "Carpet Area" | "Built Up Area" | "Super Built Up Area" | "RERA Carpet Area" | "Lumpsum Rate" | "Floorwise Rate"; // Rate basis — STEP 6
  ratePerSqFt?: string; // Rate per sq.ft. (accepts numbers and text) — STEP 6
  rentPerMonth?: string; // Rent per month — STEP 6
  negativePoints?: string;
  agentOpinion?: string;

  // STEP 7 — Final remarks
  finalRemarks?: string;

  status: FieldVisitStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  /**
   * Neon Auth UUID of the Maker/admin who last edited this visit after
   * submission. Absent when the visit has only ever been submitted (never
   * edited). `engineerId`/`createdAt`/`submittedAt` remain the immutable
   * original-creation record; `updatedAt` is the edit timestamp.
   */
  updatedById?: string;
  /**
   * Neon Auth UUID of the Checker who edited this visit during their review
   * (CHECKER_PENDING stage). Independent of `updatedById` (the Maker's edit)
   * so both attributions are preserved permanently.
   */
  checkerUpdatedById?: string;
}

export interface CaseHistoryEntry {
  id: string;
  caseId: string;
  action: string;
  fromStage?: CaseStage;
  toStage?: CaseStage;
  performedById: string;
  performedAt: string;
  note?: string;
}

export interface MakerValuation {
  id: string;
  caseId: string;
  // Basic Details
  dateOfValuation: string; // ISO date string
  dateOfInspection: string; // ISO date string
  refNo: string;
  branch: string;
  bankName: string;
  // Additional Fields
  purchaserName?: string | undefined;
  typeOfProperty?: string | undefined;
  flatNo?: string | undefined;
  locatedOnFloor?: string | undefined;
  wing?: string | undefined;
  buildingName?: string | undefined;
  landmark?: string | undefined;
  roadNameArea?: string | undefined;
  location?: string | undefined;
  plotNo?: string | undefined;
  ctsNo?: string | undefined;
  sNo?: string | undefined;
  other?: string | undefined;
  village?: string | undefined;
  wardNo?: string | undefined;
  taluka?: string | undefined;
  blockNo?: string | undefined;
  district?: string | undefined;
  pinCode?: string | undefined;
  // General Section Fields
  purposeOfValuation?: string | undefined;
  documentsName1?: string | undefined;
  documentsDetails1?: string | undefined;
  documentsName2?: string | undefined;
  documentsDetails2?: string | undefined;
  documentsName3?: string | undefined;
  documentsDetails3?: string | undefined;
  nameOfOwner?: string | undefined;
  address?: string | undefined;
  configurationInShort?: string | undefined;
  configurationFullDescription?: string | undefined;
  locality?: string | undefined;
  classOfLocality1?: string | undefined;
  classOfLocality2?: string | undefined;
  classOfLocality3?: string | undefined;
  municipalCorporation?: string | undefined;
  typeOfLand?: string | undefined;
  genuinenessOrAuthenticity?: string | undefined;
  anyOtherComments?: string | undefined;
  nosOfFloor?: string | undefined;
  nosOfStaircase?: string | undefined;
  nosOfLifts?: string | undefined;
  // Boundaries Section
  boundaryPropertyNorth?: string | undefined;
  boundaryPropertySouth?: string | undefined;
  boundaryPropertyEast?: string | undefined;
  boundaryPropertyWest?: string | undefined;
  boundaryPropertyMeasured?: string | undefined;
  boundarySiteNorth?: string | undefined;
  boundarySiteSouth?: string | undefined;
  boundarySiteEast?: string | undefined;
  boundarySiteWest?: string | undefined;
  boundarySiteMeasured?: string | undefined;
  latitude?: string | undefined;
  longitude?: string | undefined;
  occupancy?: string | undefined;
  // Apartment Section
  yearOfConstruction?: string | undefined;
  ageOfBuilding?: string | undefined;
  residualLife?: string | undefined;
  typeOfStructure?: string | undefined;
  nosOfUnitPerFloor?: string | undefined;
  buildingType?: string | undefined;
  appearance?: string | undefined;
  qualityOfConstruction?: string | undefined;
  maintenance?: string | undefined;
  protectedWaterSupply?: string | undefined;
  undergroundSewerage?: string | undefined;
  nosOfParking?: string | undefined;
  compoundWall?: string | undefined;
  openCoveredParking?: string | undefined;
  pavementLaidAroundBuilding?: string | undefined;
  // Flat Section
  flooring?: string | undefined;
  doors?: string | undefined;
  windows?: string | undefined;
  fittings?: string | undefined;
  finishing?: string | undefined;
  assessmentNo?: string | undefined;
  taxAmount?: string | undefined;
  taxPaidInNameOf?: string | undefined;
  electricityServiceConnectionNo?: string | undefined;
  meterCardInNameOf?: string | undefined;
  meterCardDated?: string | undefined;
  undividedAreaOfLand?: string | undefined;
  // Marketability Section
  marketability?: string | undefined;
  positiveFactors?: string | undefined;
  negativeFactors?: string | undefined;
  // Area Calculation Section
  physicalMeasuredArea?: string | undefined;
  physicalMeasuredAreaBasis?: string | undefined;
  documentedArea?: string | undefined;
  documentedAreaBasis?: string | undefined;
  approvedPlanArea?: string | undefined;
  approvedPlanAreaBasis?: string | undefined;
  builtUpArea?: string | undefined;
  builtUpAreaBasis?: string | undefined;
  adoptedArea?: string | undefined;
  adoptedAreaBasis?: string | undefined;
  floorSpaceIndex?: string | undefined;
  pdfBytes: string; // Base64-encoded PDF
  createdById: string;
  createdAt: string;
}
