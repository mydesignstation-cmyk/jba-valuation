import type { ValuationCase } from "@/types";

/** Mock data for frontend development before the backend exists. */

export const mockCases: ValuationCase[] = [
  {
    id: "case-1",
    caseNumber: "VC-2026-0001",
    bankName: "Example Bank",
    propertyAddress: "12 Sample Street, Mumbai",
    stage: "CREATED",
    createdById: "user-admin-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
