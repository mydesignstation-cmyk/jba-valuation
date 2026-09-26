/**
 * Branch service: Client-safe wrapper around server API functions.
 */

import {
  api_listBranches,
  api_getBranch,
  api_createBranch,
  api_updateBranch,
  api_deleteBranch,
} from "@/server/api.server";
import type { Branch } from "@/types";

export async function listBranches(): Promise<Branch[]> {
  return api_listBranches();
}

export async function getBranch(id: string): Promise<Branch | undefined> {
  return api_getBranch(id);
}

export async function createBranch(name: string): Promise<Branch> {
  return api_createBranch(name);
}

export async function updateBranch(id: string, name: string): Promise<Branch | undefined> {
  return api_updateBranch(id, name);
}

export async function deleteBranch(id: string): Promise<boolean> {
  return api_deleteBranch(id);
}
