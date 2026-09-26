import type { Bank } from "@/types";

/** Mock data for frontend development before the backend exists. */

export const mockBanks: Bank[] = [
  {
    id: "bank-001",
    name: "State Bank of India",
    createdAt: new Date("2025-01-01T09:00:00Z").toISOString(),
    updatedAt: new Date("2025-01-01T09:00:00Z").toISOString(),
  },
  {
    id: "bank-002",
    name: "HDFC Bank",
    createdAt: new Date("2025-01-02T09:00:00Z").toISOString(),
    updatedAt: new Date("2025-01-02T09:00:00Z").toISOString(),
  },
  {
    id: "bank-003",
    name: "ICICI Bank",
    createdAt: new Date("2025-01-03T09:00:00Z").toISOString(),
    updatedAt: new Date("2025-01-03T09:00:00Z").toISOString(),
  },
  {
    id: "bank-004",
    name: "Axis Bank",
    createdAt: new Date("2025-01-04T09:00:00Z").toISOString(),
    updatedAt: new Date("2025-01-04T09:00:00Z").toISOString(),
  },
  {
    id: "bank-005",
    name: "Kotak Mahindra Bank",
    createdAt: new Date("2025-01-05T09:00:00Z").toISOString(),
    updatedAt: new Date("2025-01-05T09:00:00Z").toISOString(),
  },
  {
    id: "bank-006",
    name: "Yes Bank",
    createdAt: new Date("2025-01-06T09:00:00Z").toISOString(),
    updatedAt: new Date("2025-01-06T09:00:00Z").toISOString(),
  },
  {
    id: "bank-007",
    name: "Bandhan Bank",
    createdAt: new Date("2025-01-07T09:00:00Z").toISOString(),
    updatedAt: new Date("2025-01-07T09:00:00Z").toISOString(),
  },
  {
    id: "bank-008",
    name: "IndusInd Bank",
    createdAt: new Date("2025-01-08T09:00:00Z").toISOString(),
    updatedAt: new Date("2025-01-08T09:00:00Z").toISOString(),
  },
];
