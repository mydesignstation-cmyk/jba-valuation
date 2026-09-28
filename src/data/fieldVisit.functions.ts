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
  api_submitFieldVisit as db_submitFieldVisit,
} from "@/server/api.server";
import type { FieldVisit } from "@/types";
import type { FieldVisitFormValues } from "@/schemas/fieldVisit.schema";

type GetFieldVisitInput = { token: string; caseId: string };
type SubmitFieldVisitInput = {
  token: string;
  caseId: string;
  data: FieldVisitFormValues;
};

const getMyFieldVisitFn = createServerFn({ method: "GET" })
  .validator((input: GetFieldVisitInput) => input)
  .handler(({ data }) => db_getMyFieldVisit(data.token, data.caseId));

const submitFieldVisitFn = createServerFn({ method: "POST" })
  .validator((input: SubmitFieldVisitInput) => input)
  .handler(({ data }) => db_submitFieldVisit(data.token, data.caseId, data.data));

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
