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
