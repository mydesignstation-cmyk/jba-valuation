/**
 * Client-callable server functions for Case data access.
 * Boundary: Client to createServerFn (here) to the server API to Drizzle/Neon.
 * Lives outside the src/server directory so client code may import it;
 * createServerFn strips the server-only handler and imports from the client bundle.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  api_listCases as db_listCases,
  api_getCase as db_getCase,
  api_createCase as db_createCase,
  api_updateCase as db_updateCase,
  api_deleteCase as db_deleteCase,
  api_listMyCases as db_listMyCases,
} from "@/server/api.server";
import type { ValuationCase } from "@/types";

type CreateCaseInput = {
  requestNumber: string;
  customerId: string;
  bankId: string;
  branchId: string;
  assignedEngineerId: string;
  createdById: string;
};

type UpdateCaseData = {
  requestNumber?: string;
  customerId?: string;
  bankId?: string;
  branchId?: string;
  assignedEngineerId?: string;
  stage?: string;
};

type UpdateCaseInput = { id: string; data: UpdateCaseData };

const listCasesFn = createServerFn({ method: "GET" }).handler(() => db_listCases());

// The client passes a Neon Auth session TOKEN (a credential), never a user id.
// The server verifies the token with Neon Auth and derives the engineer id from
// the verified response, so the browser is not the authority on identity.
const listMyCasesFn = createServerFn({ method: "GET" })
  .validator((token: string) => token)
  .handler(({ data }) => db_listMyCases(data));

const getCaseFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data }) => db_getCase(data));

const createCaseFn = createServerFn({ method: "POST" })
  .validator((input: CreateCaseInput) => input)
  .handler(({ data }) => db_createCase(data));

const updateCaseFn = createServerFn({ method: "POST" })
  .validator((input: UpdateCaseInput) => input)
  .handler(({ data }) => db_updateCase(data.id, data.data));

const deleteCaseFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(({ data }) => db_deleteCase(data));

export function api_listCases(): Promise<ValuationCase[]> {
  return listCasesFn();
}

/**
 * Cases assigned to the currently authenticated Site Engineer.
 * Pass the Neon Auth session token; the server verifies it and derives the id.
 */
export function api_listMyCases(token: string): Promise<ValuationCase[]> {
  return listMyCasesFn({ data: token });
}

export function api_getCase(id: string): Promise<ValuationCase | undefined> {
  return getCaseFn({ data: id });
}

export function api_createCase(data: CreateCaseInput): Promise<ValuationCase> {
  return createCaseFn({ data });
}

export function api_updateCase(
  id: string,
  data: UpdateCaseData,
): Promise<ValuationCase | undefined> {
  return updateCaseFn({ data: { id, data } });
}

export function api_deleteCase(id: string): Promise<boolean> {
  return deleteCaseFn({ data: id });
}
