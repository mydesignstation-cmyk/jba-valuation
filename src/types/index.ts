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

  // STEP 2 — Property details
  landmark?: string;
  propertyType?: string;
  localityType?: string;
  occupancyStatus?: string;

  // STEP 3 — Building information
  structureType?: string;
  occupancyLevel?: string;
  floorsInBuilding?: number;
  locatedOnFloor?: string;
  flatsOnFloor?: number;
  wingsInBuilding?: number;
  liftsStaircases?: number;

  // STEP 4 — Construction details
  yearOfConstruction?: number;
  constructionStage?: string;
  workDescription?: string;

  // STEP 5 — Property boundaries
  boundaryEast?: string;
  boundaryWest?: string;
  boundaryNorth?: string;
  boundarySouth?: string;

  // STEP 6 — Assessment details
  approachRoadCondition?: string;
  areaSqFt?: string;
  ratePerSqFt?: string;
  negativePoints?: string;
  agentOpinion?: string;

  // STEP 7 — Final remarks
  finalRemarks?: string;

  status: FieldVisitStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
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
