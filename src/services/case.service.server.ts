/**
 * Case service: Client-safe wrapper around server API functions.
 */

import {
  api_listCases,
  api_getCase,
  api_createCase,
  api_updateCase,
  api_deleteCase,
} from "@/server/api.server";
import type { ValuationCase } from "@/types";

export async function listCases(): Promise<ValuationCase[]> {
  return api_listCases();
}

export async function getCase(id: string): Promise<ValuationCase | undefined> {
  return api_getCase(id);
}

export async function createCase(data: {
  requestNumber: string;
  customerId: string;
  bankId: string;
  branchId: string;
  assignedEngineerId: string;
  createdById: string;
}): Promise<ValuationCase> {
  return api_createCase(data);
}

export async function updateCase(
  id: string,
  data: {
    requestNumber?: string;
    customerId?: string;
    bankId?: string;
    branchId?: string;
    assignedEngineerId?: string;
    stage?: string;
  },
): Promise<ValuationCase | undefined> {
  return api_updateCase(id, data);
}

export async function deleteCase(id: string): Promise<boolean> {
  return api_deleteCase(id);
}
