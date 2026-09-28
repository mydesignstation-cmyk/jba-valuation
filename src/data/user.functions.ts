/**
 * Client-callable server functions for User (Neon Auth) data access.
 * Boundary: Client to createServerFn (here) to the server API to Drizzle/SQL.
 * Lives outside the src/server directory so client code may import it;
 * createServerFn strips the server-only handler and imports from the client bundle.
 *
 * Users are read from Neon Auth's synced `neon_auth."user"` table server-side.
 * No app-owned users table exists or is created here.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  api_listSiteEngineers as db_listSiteEngineers,
  api_getSiteEngineer as db_getSiteEngineer,
  api_listMakers as db_listMakers,
  api_getMaker as db_getMaker,
  api_getChecker as db_getChecker,
  api_getAssigner as db_getAssigner,
  api_getUser as db_getUser,
} from "@/server/api.server";
import type { User } from "@/types";

const listSiteEngineersFn = createServerFn({ method: "GET" }).handler(() => db_listSiteEngineers());

const getSiteEngineerFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data }) => db_getSiteEngineer(data));

const listMakersFn = createServerFn({ method: "GET" }).handler(() => db_listMakers());

const getMakerFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data }) => db_getMaker(data));

const getCheckerFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data }) => db_getChecker(data));

const getAssignerFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data }) => db_getAssigner(data));

const getUserFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data }) => db_getUser(data));

export function api_listSiteEngineers(): Promise<User[]> {
  return listSiteEngineersFn();
}

export function api_getSiteEngineer(id: string): Promise<User | undefined> {
  return getSiteEngineerFn({ data: id });
}

/** Real Neon Auth users with the MAKER role (for the Assign Maker picker). */
export function api_listMakers(): Promise<User[]> {
  return listMakersFn();
}

/** Resolve a single MAKER user by id (for showing the assigned Maker's name). */
export function api_getMaker(id: string): Promise<User | undefined> {
  return getMakerFn({ data: id });
}

/** Resolve a single CHECKER user by id (for showing who assigned the Maker). */
export function api_getChecker(id: string): Promise<User | undefined> {
  return getCheckerFn({ data: id });
}

/**
 * Resolve the user who assigned the Maker (Checker, Admin, or Super Admin),
 * with their real role, so the UI can show a name + correct label instead of a
 * raw UUID when an admin performed the assignment.
 */
export function api_getAssigner(id: string): Promise<User | undefined> {
  return getAssignerFn({ data: id });
}

/**
 * Resolve any Neon Auth user by id with their real role. Used for attribution
 * fields where the actor may be a specific role or an admin acting for them —
 * e.g. "Checked By" and "Uploaded By" on case detail.
 */
export function api_getUser(id: string): Promise<User | undefined> {
  return getUserFn({ data: id });
}
