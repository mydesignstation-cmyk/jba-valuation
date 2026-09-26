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
  stage: CaseStage;
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
