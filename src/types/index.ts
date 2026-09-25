/**
 * Central domain types for the valuation case-management app.
 * Aligned with docs/domain-foundation.md.
 */

export type Role = "super_admin" | "admin" | "site_engineer" | "maker" | "checker" | "uploader";

export type CaseStage =
  | "created"
  | "engineer_assigned"
  | "field_visit_submitted"
  | "maker_completed"
  | "checker_completed"
  | "uploaded";

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
