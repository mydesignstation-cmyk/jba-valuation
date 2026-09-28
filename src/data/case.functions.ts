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
  api_listCheckerCases as db_listCheckerCases,
  api_listMakerCases as db_listMakerCases,
  api_assignMaker as db_assignMaker,
  api_submitToChecker as db_submitToChecker,
  api_submitToUploader as db_submitToUploader,
  api_listUploaderCases as db_listUploaderCases,
  api_markUploadCompleted as db_markUploadCompleted,
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

type AssignMakerInput = { token: string; caseId: string; makerId: string };
type SubmitToCheckerInput = { token: string; caseId: string };
type SubmitToUploaderInput = { token: string; caseId: string };
type MarkUploadCompletedInput = { token: string; caseId: string };

const listCasesFn = createServerFn({ method: "GET" }).handler(() => db_listCases());

// The client passes a Neon Auth session TOKEN (a credential), never a user id.
// The server verifies the token with Neon Auth and derives the engineer id from
// the verified response, so the browser is not the authority on identity.
const listMyCasesFn = createServerFn({ method: "GET" })
  .validator((token: string) => token)
  .handler(({ data }) => db_listMyCases(data));

// Checker queue + Maker "my cases": the client passes only its Neon Auth
// session TOKEN. The server verifies it, enforces the caller's role, and (for
// makers) derives the maker id from the verified token — never trusting a
// client-supplied id or role.
const listCheckerCasesFn = createServerFn({ method: "GET" })
  .validator((token: string) => token)
  .handler(({ data }) => db_listCheckerCases(data));

const listMakerCasesFn = createServerFn({ method: "GET" })
  .validator((token: string) => token)
  .handler(({ data }) => db_listMakerCases(data));

const assignMakerFn = createServerFn({ method: "POST" })
  .validator((input: AssignMakerInput) => input)
  .handler(({ data }) => db_assignMaker(data.token, data.caseId, data.makerId));

const submitToCheckerFn = createServerFn({ method: "POST" })
  .validator((input: SubmitToCheckerInput) => input)
  .handler(({ data }) => db_submitToChecker(data.token, data.caseId));

const submitToUploaderFn = createServerFn({ method: "POST" })
  .validator((input: SubmitToUploaderInput) => input)
  .handler(({ data }) => db_submitToUploader(data.token, data.caseId));

const listUploaderCasesFn = createServerFn({ method: "GET" })
  .validator((token: string) => token)
  .handler(({ data }) => db_listUploaderCases(data));

const markUploadCompletedFn = createServerFn({ method: "POST" })
  .validator((input: MarkUploadCompletedInput) => input)
  .handler(({ data }) => db_markUploadCompleted(data.token, data.caseId));

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

/**
 * Cases eligible for the Checker queue (field visit submitted / maker assigned).
 * Not filtered by checker id — all Checkers see the same cases. Pass the Neon
 * Auth session token; the server verifies it and enforces the CHECKER role.
 */
export function api_listCheckerCases(token: string): Promise<ValuationCase[]> {
  return listCheckerCasesFn({ data: token });
}

/**
 * Cases assigned to the currently authenticated Maker. Pass the Neon Auth
 * session token; the server verifies it and derives the maker id from the token.
 */
export function api_listMakerCases(token: string): Promise<ValuationCase[]> {
  return listMakerCasesFn({ data: token });
}

/**
 * Assign a Maker to a case (Checker action). Pass the Neon Auth session token;
 * the server verifies the CHECKER role and enforces that the field visit is
 * submitted and no Maker is already assigned. Rejects otherwise.
 */
export function api_assignMaker(
  token: string,
  caseId: string,
  makerId: string,
): Promise<ValuationCase> {
  return assignMakerFn({ data: { token, caseId, makerId } });
}

/**
 * Submit a case from the Maker back to the Checker for review (Maker action).
 * Advances the case to CHECKER_PENDING. Pass the Neon Auth session token; the
 * server verifies the MAKER role, that the caller is the assigned Maker, that
 * the case is at a Maker stage, and that a field visit has been submitted.
 */
export function api_submitToChecker(token: string, caseId: string): Promise<ValuationCase> {
  return submitToCheckerFn({ data: { token, caseId } });
}

/**
 * Submit a case from the Checker to the Uploader (Checker action). Advances the
 * case to UPLOADER_PENDING. Pass the Neon Auth session token; the server
 * verifies the CHECKER role and that the case is at CHECKER_PENDING.
 */
export function api_submitToUploader(token: string, caseId: string): Promise<ValuationCase> {
  return submitToUploaderFn({ data: { token, caseId } });
}

/**
 * Cases in the Uploader queue (awaiting final upload). Not filtered by user id.
 * Pass the Neon Auth session token; the server verifies the UPLOADER role.
 */
export function api_listUploaderCases(token: string): Promise<ValuationCase[]> {
  return listUploaderCasesFn({ data: token });
}

/**
 * Close a case (Uploader action). Advances the case from UPLOADER_PENDING to
 * COMPLETED. Pass the Neon Auth session token; the server verifies the UPLOADER
 * role and that the case is awaiting upload.
 */
export function api_markUploadCompleted(token: string, caseId: string): Promise<ValuationCase> {
  return markUploadCompletedFn({ data: { token, caseId } });
}
