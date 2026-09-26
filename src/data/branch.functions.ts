/**
 * Client-callable server functions for Branch data access.
 * Boundary: Client to createServerFn (here) to the server API to Drizzle/Neon.
 * Lives outside the src/server directory so client code may import it;
 * createServerFn strips the server-only handler and imports from the client bundle.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  api_listBranches as db_listBranches,
  api_getBranch as db_getBranch,
  api_createBranch as db_createBranch,
  api_updateBranch as db_updateBranch,
  api_deleteBranch as db_deleteBranch,
} from "@/server/api.server";
import type { Branch } from "@/types";

type UpdateBranchInput = { id: string; name: string };

const listBranchesFn = createServerFn({ method: "GET" }).handler(() => db_listBranches());

const getBranchFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data }) => db_getBranch(data));

const createBranchFn = createServerFn({ method: "POST" })
  .validator((name: string) => name)
  .handler(({ data }) => db_createBranch(data));

const updateBranchFn = createServerFn({ method: "POST" })
  .validator((input: UpdateBranchInput) => input)
  .handler(({ data }) => db_updateBranch(data.id, data.name));

const deleteBranchFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(({ data }) => db_deleteBranch(data));

export function api_listBranches(): Promise<Branch[]> {
  return listBranchesFn();
}

export function api_getBranch(id: string): Promise<Branch | undefined> {
  return getBranchFn({ data: id });
}

export function api_createBranch(name: string): Promise<Branch> {
  return createBranchFn({ data: name });
}

export function api_updateBranch(id: string, name: string): Promise<Branch | undefined> {
  return updateBranchFn({ data: { id, name } });
}

export function api_deleteBranch(id: string): Promise<boolean> {
  return deleteBranchFn({ data: id });
}
