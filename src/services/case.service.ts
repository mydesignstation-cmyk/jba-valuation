import type { ValuationCase } from "@/types";
import { mockCases } from "@/mocks/cases";

/**
 * Service layer: single place for case data access.
 * Mock-backed for now; swap internals for real API calls later
 * without touching components.
 */

export async function listCases(): Promise<ValuationCase[]> {
  return mockCases;
}

export async function getCase(id: string): Promise<ValuationCase | undefined> {
  return mockCases.find((c) => c.id === id);
}
