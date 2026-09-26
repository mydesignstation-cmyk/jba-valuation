/**
 * Service layer: Client-safe wrapper around server API functions.
 * These delegate to server-only functions (api.server.ts), keeping database code out of the client bundle.
 */

import {
  api_listCustomers,
  api_getCustomer,
  api_createCustomer,
  api_updateCustomer,
  api_deleteCustomer,
} from "@/server/api.server";
import type { Customer } from "@/types";

export async function listCustomers(): Promise<Customer[]> {
  return api_listCustomers();
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  return api_getCustomer(id);
}

export async function createCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">,
): Promise<Customer> {
  return api_createCustomer(data);
}

export async function updateCustomer(
  id: string,
  data: Partial<Customer>,
): Promise<Customer | undefined> {
  return api_updateCustomer(id, data);
}

export async function deleteCustomer(id: string): Promise<boolean> {
  return api_deleteCustomer(id);
}
