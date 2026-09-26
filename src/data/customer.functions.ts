/**
 * Client-callable server functions for Customer data access.
 *
 * These are the only customer data entry points client code should import.
 * Each createServerFn runs its handler server-side and exposes an RPC fetcher
 * to the client, so the Drizzle/Neon code in the server API never gets
 * bundled into the browser.
 *
 * Boundary: Client to createServerFn (here) to the server API to Drizzle/Neon.
 * This file lives outside the src/server directory because the client import
 * guard denies importing anything from there; createServerFn itself performs
 * the client/server split so the handler and its server-only imports are
 * stripped from the client bundle.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  api_listCustomers as db_listCustomers,
  api_getCustomer as db_getCustomer,
  api_createCustomer as db_createCustomer,
  api_updateCustomer as db_updateCustomer,
  api_deleteCustomer as db_deleteCustomer,
} from "@/server/api.server";
import type { Customer } from "@/types";

type CreateCustomerInput = Omit<Customer, "id" | "createdAt" | "updatedAt">;
type UpdateCustomerInput = { id: string; data: Partial<Customer> };

const listCustomersFn = createServerFn({ method: "GET" }).handler(() => db_listCustomers());

const getCustomerFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data }) => db_getCustomer(data));

const createCustomerFn = createServerFn({ method: "POST" })
  .validator((input: CreateCustomerInput) => input)
  .handler(({ data }) => db_createCustomer(data));

const updateCustomerFn = createServerFn({ method: "POST" })
  .validator((input: UpdateCustomerInput) => input)
  .handler(({ data }) => db_updateCustomer(data.id, data.data));

const deleteCustomerFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(({ data }) => db_deleteCustomer(data));

// Thin adapters that preserve the original call ergonomics used across the app.
export function api_listCustomers(): Promise<Customer[]> {
  return listCustomersFn();
}

export function api_getCustomer(id: string): Promise<Customer | undefined> {
  return getCustomerFn({ data: id });
}

export function api_createCustomer(data: CreateCustomerInput): Promise<Customer> {
  return createCustomerFn({ data });
}

export function api_updateCustomer(
  id: string,
  data: Partial<Customer>,
): Promise<Customer | undefined> {
  return updateCustomerFn({ data: { id, data } });
}

export function api_deleteCustomer(id: string): Promise<boolean> {
  return deleteCustomerFn({ data: id });
}
