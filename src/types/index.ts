/**
 * Central domain types for the valuation case-management app.
 * Aligned with docs/domain-foundation.md.
 */

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SITE_ENGINEER"
  | "MAKER"
  | "CHECKER"
  | "UPLOADER";

export type CaseStage =
  | "CREATED"
  | "ASSIGNED"
  | "FIELD_VISIT_PENDING"
  | "FIELD_VISIT_SUBMITTED"
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

export interface ValuationCase {
  id: string;
  caseNumber: string;
  bankName: string;
  propertyAddress: string;
  stage: CaseStage;
  assignedEngineerId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
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
