/**
 * Client-callable server functions for Bank data access.
 * Boundary: Client to createServerFn (here) to the server API to Drizzle/Neon.
 * Lives outside the src/server directory so client code may import it;
 * createServerFn strips the server-only handler and imports from the client bundle.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  api_listBanks as db_listBanks,
  api_getBank as db_getBank,
  api_createBank as db_createBank,
  api_updateBank as db_updateBank,
  api_deleteBank as db_deleteBank,
} from "@/server/api.server";
import type { Bank } from "@/types";

type UpdateBankInput = { id: string; name: string };

const listBanksFn = createServerFn({ method: "GET" }).handler(() => db_listBanks());

const getBankFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data }) => db_getBank(data));

const createBankFn = createServerFn({ method: "POST" })
  .validator((name: string) => name)
  .handler(({ data }) => db_createBank(data));

const updateBankFn = createServerFn({ method: "POST" })
  .validator((input: UpdateBankInput) => input)
  .handler(({ data }) => db_updateBank(data.id, data.name));

const deleteBankFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(({ data }) => db_deleteBank(data));

export function api_listBanks(): Promise<Bank[]> {
  return listBanksFn();
}

export function api_getBank(id: string): Promise<Bank | undefined> {
  return getBankFn({ data: id });
}

export function api_createBank(name: string): Promise<Bank> {
  return createBankFn({ data: name });
}

export function api_updateBank(id: string, name: string): Promise<Bank | undefined> {
  return updateBankFn({ data: { id, name } });
}

export function api_deleteBank(id: string): Promise<boolean> {
  return deleteBankFn({ data: id });
}
