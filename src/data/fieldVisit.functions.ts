/**
 * Client-callable server functions for Field Visit data access.
 * Boundary: Client to createServerFn (here) to the server API to Drizzle/Neon.
 * Lives outside the src/server directory so client code may import it;
 * createServerFn strips the server-only handler from the client bundle.
 *
 * The client passes a Neon Auth session TOKEN (a credential), never a user id
 * or engineer id. The server verifies the token and derives the engineer's id,
 * then enforces that the target Case is assigned to that engineer.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  api_getMyFieldVisit as db_getMyFieldVisit,
  api_getCaseFieldVisit as db_getCaseFieldVisit,
  api_submitFieldVisit as db_submitFieldVisit,
  api_getFieldVisitPdf as db_getFieldVisitPdf,
  type FieldVisitPdfResult,
} from "@/server/api.server";
import type { FieldVisit } from "@/types";
import type { FieldVisitFormValues } from "@/schemas/fieldVisit.schema";

type GetFieldVisitInput = { token: string; caseId: string };
type GetCaseFieldVisitInput = { caseId: string };
type GetFieldVisitPdfInput = { caseId: string };
type SubmitFieldVisitInput = {
  token: string;
  caseId: string;
  data: FieldVisitFormValues;
};

const getMyFieldVisitFn = createServerFn({ method: "GET" })
  .validator((input: GetFieldVisitInput) => input)
  .handler(({ data }) => db_getMyFieldVisit(data.token, data.caseId));

const getCaseFieldVisitFn = createServerFn({ method: "GET" })
  .validator((input: GetCaseFieldVisitInput) => input)
  .handler(({ data }) => db_getCaseFieldVisit(data.caseId));

const submitFieldVisitFn = createServerFn({ method: "POST" })
  .validator((input: SubmitFieldVisitInput) => input)
  .handler(({ data }) => db_submitFieldVisit(data.token, data.caseId, data.data));

const getFieldVisitPdfFn = createServerFn({ method: "GET" })
  .validator((input: GetFieldVisitPdfInput) => input)
  .handler(({ data }) => db_getFieldVisitPdf(data.caseId));

/**
 * Read the current engineer's Field Visit for a Case they own.
 * Pass the Neon Auth session token; the server verifies it and checks ownership.
 * Resolves to undefined when no Field Visit exists yet.
 */
export function api_getMyFieldVisit(
  token: string,
  caseId: string,
): Promise<FieldVisit | undefined> {
  return getMyFieldVisitFn({ data: { token, caseId } });
}

/**
 * Read a Case's Field Visit by case id, for anyone allowed to view the case
 * detail page (admins, maker, checker, and the owning site engineer). No token
 * is passed; authorization is enforced by the case-detail route guard, matching
 * how api_getCase reads case data. Resolves to undefined when none exists yet.
 */
export function api_getCaseFieldVisit(caseId: string): Promise<FieldVisit | undefined> {
  return getCaseFieldVisitFn({ data: { caseId } });
}

/**
 * Submit the Field Visit for a Case the current engineer owns.
 * Pass the Neon Auth session token; the server verifies it and checks ownership.
 */
export function api_submitFieldVisit(
  token: string,
  caseId: string,
  data: FieldVisitFormValues,
): Promise<FieldVisit> {
  return submitFieldVisitFn({ data: { token, caseId, data } });
}

/**
 * Generate the Field Visit PDF for a Case on demand, from the LATEST saved
 * data in Neon. Available to any role allowed to view the case detail page
 * (authorization is enforced by the route guard, matching api_getCaseFieldVisit).
 *
 * Resolves to `{ filename, base64 }`; the client decodes the base64 to a Blob
 * and triggers a download. Rejects when the Field Visit is missing or not yet
 * submitted. Nothing is stored — re-calling after an edit reflects the change.
 */
export function api_getFieldVisitPdf(caseId: string): Promise<FieldVisitPdfResult> {
  return getFieldVisitPdfFn({ data: { caseId } });
}
