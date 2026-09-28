import type { ValuationCase } from "@/types";

/** Mock data for frontend development before the backend exists. */

export const mockCases: ValuationCase[] = [
  {
    id: "case-1",
    caseNumber: "VAL-2026-0001",
    requestNumber: "REQ-SBI-88213",
    customerId: "cust-001",
    bankId: "bank-001",
    branchId: "branch-001",
    assignedEngineerId: "eng-001",
    assignedMakerId: "",
    assignedByCheckerId: "",
    stage: "ASSIGNED",
    createdById: "u-admin",
    createdAt: new Date("2026-01-10T09:30:00Z").toISOString(),
    updatedAt: new Date("2026-01-10T09:30:00Z").toISOString(),
  },
  {
    id: "case-2",
    caseNumber: "VAL-2026-0002",
    requestNumber: "REQ-HDFC-44120",
    customerId: "cust-002",
    bankId: "bank-002",
    branchId: "branch-002",
    assignedEngineerId: "eng-002",
    assignedMakerId: "",
    assignedByCheckerId: "",
    stage: "ASSIGNED",
    createdById: "u-admin",
    createdAt: new Date("2026-01-12T11:15:00Z").toISOString(),
    updatedAt: new Date("2026-01-12T11:15:00Z").toISOString(),
  },
];
