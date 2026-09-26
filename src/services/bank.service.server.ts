/**
 * Bank service: Client-safe wrapper around server API functions.
 */

import { api_listBanks, api_getBank, api_createBank, api_updateBank, api_deleteBank } from "@/server/api.server";
import type { Bank } from "@/types";

export async function listBanks(): Promise<Bank[]> {
  return api_listBanks();
}

export async function getBank(id: string): Promise<Bank | undefined> {
  return api_getBank(id);
}

export async function createBank(name: string): Promise<Bank> {
  return api_createBank(name);
}

export async function updateBank(id: string, name: string): Promise<Bank | undefined> {
  return api_updateBank(id, name);
}

export async function deleteBank(id: string): Promise<boolean> {
  return api_deleteBank(id);
}
