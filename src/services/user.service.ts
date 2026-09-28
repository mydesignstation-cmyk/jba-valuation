import type { User } from "@/types";
import {
  api_listSiteEngineers,
  api_getSiteEngineer,
  api_listMakers,
  api_getMaker,
  api_getChecker,
  api_getAssigner,
} from "@/data/user.functions";

/**
 * Service layer: single place for user data access.
 *
 * Backed by real Neon Auth users (table `neon_auth."user"`) read server-side
 * through the createServerFn boundary in `@/data/user.functions`. The Case UI
 * and other consumers call these functions without knowing the data source.
 */

export async function listSiteEngineers(): Promise<User[]> {
  return api_listSiteEngineers();
}

export async function getSiteEngineer(id: string): Promise<User | undefined> {
  return api_getSiteEngineer(id);
}

export async function listMakers(): Promise<User[]> {
  return api_listMakers();
}

export async function getMaker(id: string): Promise<User | undefined> {
  return api_getMaker(id);
}

export async function getChecker(id: string): Promise<User | undefined> {
  return api_getChecker(id);
}

/** Resolve who assigned the Maker (Checker/Admin/Super Admin) with their role. */
export async function getAssigner(id: string): Promise<User | undefined> {
  return api_getAssigner(id);
}
