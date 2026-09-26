import type { User } from "@/types";
import { api_listSiteEngineers, api_getSiteEngineer } from "@/data/user.functions";

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
