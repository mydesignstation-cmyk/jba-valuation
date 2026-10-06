/**
 * Server API routes for database operations.
 * These functions run server-side only and won't be bundled into the client.
 * Using .server.ts convention for TanStack Start.
 */

import { getDb } from "@/db";
import { customers, banks, branches, cases, fieldVisits } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Customer, Bank, Branch, ValuationCase, User, FieldVisit, Role } from "@/types";
import { requireServerUser } from "@/server/auth.server";
import { fieldVisitFormSchema } from "@/schemas/fieldVisit.schema";
import { buildFieldVisitPdf } from "@/server/fieldVisitPdf.server";

// ============================================================================
// USERS (Neon Auth)
// ============================================================================
//
// Neon Auth syncs its users into this same database under the `neon_auth`
// schema (table `neon_auth."user"`, quoted because `user` is reserved).
// The app's DATABASE_URL role has read access. We read it directly here —
// server-side only — instead of maintaining any app-owned users table.
//
// Only the fields the Case UI needs are selected. Banned users are excluded.

interface NeonAuthUserRow {
  id: string;
  name: string | null;
  email: string;
}

export async function api_listSiteEngineers(): Promise<User[]> {
  try {
    const result = await getDb().execute(
      sql`SELECT id, name, email
          FROM neon_auth."user"
          WHERE role = 'SITE_ENGINEER'
            AND banned IS NOT TRUE
          ORDER BY name`,
    );

    const rows = result as unknown as NeonAuthUserRow[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name ?? row.email,
      email: row.email,
      role: "SITE_ENGINEER" as const,
    }));
  } catch (error) {
    console.error("Failed to list site engineers:", error);
    throw new Error("Failed to load site engineers from database");
  }
}

export async function api_getSiteEngineer(id: string): Promise<User | undefined> {
  try {
    const result = await getDb().execute(
      sql`SELECT id, name, email
          FROM neon_auth."user"
          WHERE id = ${id}
            AND role = 'SITE_ENGINEER'
          LIMIT 1`,
    );

    const rows = result as unknown as NeonAuthUserRow[];
    const row = rows[0];
    if (!row) return undefined;

    return {
      id: row.id,
      name: row.name ?? row.email,
      email: row.email,
      role: "SITE_ENGINEER",
    };
  } catch (error) {
    console.error("Failed to get site engineer:", error);
    throw new Error("Failed to load site engineer from database");
  }
}

/**
 * List real Neon Auth users with the MAKER role, for the Checker's "Assign
 * Maker" picker. Banned users are excluded. Mirrors api_listSiteEngineers —
 * reads directly from neon_auth."user"; no app-owned users table.
 */
export async function api_listMakers(): Promise<User[]> {
  try {
    const result = await getDb().execute(
      sql`SELECT id, name, email
          FROM neon_auth."user"
          WHERE role = 'MAKER'
            AND banned IS NOT TRUE
          ORDER BY name`,
    );

    const rows = result as unknown as NeonAuthUserRow[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name ?? row.email,
      email: row.email,
      role: "MAKER" as const,
    }));
  } catch (error) {
    console.error("Failed to list makers:", error);
    throw new Error("Failed to load makers from database");
  }
}

/**
 * Resolve a single MAKER user by id (for showing the assigned Maker's name on
 * case detail). Returns undefined when not found or not a Maker.
 */
export async function api_getMaker(id: string): Promise<User | undefined> {
  try {
    const result = await getDb().execute(
      sql`SELECT id, name, email
          FROM neon_auth."user"
          WHERE id = ${id}
            AND role = 'MAKER'
          LIMIT 1`,
    );
    const rows = result as unknown as NeonAuthUserRow[];
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name ?? row.email,
      email: row.email,
      role: "MAKER",
    };
  } catch (error) {
    console.error("Failed to get maker:", error);
    throw new Error("Failed to load maker from database");
  }
}

/**
 * Resolve a single CHECKER user by id (for showing who assigned the Maker on
 * case detail). Returns undefined when not found or not a Checker.
 */
export async function api_getChecker(id: string): Promise<User | undefined> {
  try {
    const result = await getDb().execute(
      sql`SELECT id, name, email
          FROM neon_auth."user"
          WHERE id = ${id}
            AND role = 'CHECKER'
          LIMIT 1`,
    );
    const rows = result as unknown as NeonAuthUserRow[];
    const row = rows[0];
    if (!row) return undefined;

    return {
      id: row.id,
      name: row.name ?? row.email,
      email: row.email,
      role: "CHECKER",
    };
  } catch (error) {
    console.error("Failed to get checker:", error);
    throw new Error("Failed to load checker from database");
  }
}

/** Roles that are allowed to assign/reassign a Maker (see api_assignMaker). */
const ASSIGNER_ROLES = new Set<Role>(["CHECKER", "ADMIN", "SUPER_ADMIN"]);

/** Every known application role — used to validate a resolved user's role. */
const KNOWN_ROLES = new Set<Role>([
  "SUPER_ADMIN",
  "ADMIN",
  "SITE_ENGINEER",
  "MAKER",
  "CHECKER",
  "UPLOADER",
]);

/**
 * Resolve the user who assigned the Maker, regardless of whether they were a
 * Checker, Admin, or Super Admin, and return their real application role so the
 * UI can label it correctly ("Assigned by (Checker/Admin/Super Administrator)").
 * Returns undefined when the id is unknown or the user's role is not one that
 * can assign. Replaces the Checker-only lookup, which showed a raw UUID when an
 * admin performed the assignment.
 */
export async function api_getAssigner(id: string): Promise<User | undefined> {
  try {
    const result = await getDb().execute(
      sql`SELECT id, name, email, role
          FROM neon_auth."user"
          WHERE id = ${id}
          LIMIT 1`,
    );
    const rows = result as unknown as (NeonAuthUserRow & { role: string | null })[];
    const row = rows[0];
    if (!row) return undefined;

    const role = row.role && ASSIGNER_ROLES.has(row.role as Role) ? (row.role as Role) : null;
    if (!role) return undefined;

    return {
      id: row.id,
      name: row.name ?? row.email,
      email: row.email,
      role,
    };
  } catch (error) {
    console.error("Failed to get assigner:", error);
    throw new Error("Failed to load assigner from database");
  }
}

/**
 * Resolve any Neon Auth user by id, returning their real application role so
 * the UI can label them correctly. Used for attribution fields where the actor
 * can be a specific role or an admin acting on their behalf — e.g. "Checked By"
 * (Checker/admin) and "Uploaded By" (Uploader/admin) on case detail. Returns
 * undefined when the id is unknown or the user has no known application role.
 */
export async function api_getUser(id: string): Promise<User | undefined> {
  try {
    const result = await getDb().execute(
      sql`SELECT id, name, email, role
          FROM neon_auth."user"
          WHERE id = ${id}
          LIMIT 1`,
    );
    const rows = result as unknown as (NeonAuthUserRow & { role: string | null })[];
    const row = rows[0];
    if (!row) return undefined;

    const role = row.role && KNOWN_ROLES.has(row.role as Role) ? (row.role as Role) : null;
    if (!role) return undefined;

    return {
      id: row.id,
      name: row.name ?? row.email,
      email: row.email,
      role,
    };
  } catch (error) {
    console.error("Failed to get user:", error);
    throw new Error("Failed to load user from database");
  }
}

// ============================================================================
// CUSTOMERS
// ============================================================================

export async function api_listCustomers(): Promise<Customer[]> {
  try {
    const rows = await getDb().select().from(customers).orderBy(customers.created_at);

    const toISO = (value: unknown) => {
      if (!value) return new Date().toISOString();
      if (typeof value === "string") return value;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "object" && "toISOString" in value)
        return (value as { toISOString: () => string }).toISOString();
      return new Date(String(value)).toISOString();
    };

    return rows.map((row) => {
      const customer: Customer = {
        id: row.id,
        name: row.name,
        contact: row.contact,
        address: row.address,
        createdAt: toISO(row.created_at),
        updatedAt: toISO(row.updated_at),
      };
      if (row.email !== null) {
        customer.email = row.email;
      }
      return customer;
    });
  } catch (error) {
    console.error("Failed to list customers:", error);
    throw new Error("Failed to load customers from database");
  }
}

export async function api_getCustomer(id: string): Promise<Customer | undefined> {
  try {
    const rows = await getDb().select().from(customers).where(eq(customers.id, id)).limit(1);

    if (!rows || rows.length === 0) {
      return undefined;
    }

    const row = rows[0];
    if (!row) return undefined;

    // Safe timestamp conversion
    const toISO = (value: unknown) => {
      if (!value) return new Date().toISOString();
      if (typeof value === "string") return value;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "object" && "toISOString" in value)
        return (value as { toISOString: () => string }).toISOString();
      return new Date(String(value)).toISOString();
    };

    const customer: Customer = {
      id: row.id,
      name: row.name,
      contact: row.contact,
      address: row.address,
      createdAt: toISO(row.created_at),
      updatedAt: toISO(row.updated_at),
    };
    if (row.email !== null) {
      customer.email = row.email;
    }
    return customer;
  } catch (error) {
    console.error("Failed to get customer:", error);
    throw new Error("Failed to load customer from database");
  }
}

export async function api_createCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">,
): Promise<Customer> {
  try {
    const now = new Date();
    const rows = await getDb()
      .insert(customers)
      .values({
        name: data.name,
        contact: data.contact,
        email: data.email || null,
        address: data.address,
        created_at: now,
        updated_at: now,
      })
      .returning();

    if (!rows || rows.length === 0) throw new Error("Failed to retrieve created customer");

    const row = rows[0];
    if (!row) throw new Error("Failed to retrieve created customer");

    const customer: Customer = {
      id: row.id,
      name: row.name,
      contact: row.contact,
      address: row.address,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
    if (row.email !== null) {
      customer.email = row.email;
    }
    return customer;
  } catch (error) {
    console.error("Failed to create customer:", error);
    throw new Error("Failed to create customer in database");
  }
}

export async function api_updateCustomer(
  id: string,
  data: Partial<Customer>,
): Promise<Customer | undefined> {
  try {
    const existing = await getDb().select().from(customers).where(eq(customers.id, id)).limit(1);

    if (!existing || existing.length === 0) {
      return undefined;
    }

    const now = new Date();
    const updateData: {
      name?: string;
      contact?: string;
      email?: string | null;
      address?: string;
      updated_at: Date;
    } = { updated_at: now };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.contact !== undefined) updateData.contact = data.contact;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.address !== undefined) updateData.address = data.address;

    const rows = await getDb()
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();

    if (!rows || rows.length === 0) return undefined;

    const row = rows[0];
    if (!row) return undefined;

    const customer: Customer = {
      id: row.id,
      name: row.name,
      contact: row.contact,
      address: row.address,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
    if (row.email !== null) {
      customer.email = row.email;
    }
    return customer;
  } catch (error) {
    console.error("Failed to update customer:", error);
    throw new Error("Failed to update customer in database");
  }
}

export async function api_deleteCustomer(id: string): Promise<boolean> {
  await requireServerUser("SUPER_ADMIN");
  try {
    await getDb().delete(customers).where(eq(customers.id, id));
    return true;
  } catch (error) {
    console.error("Failed to delete customer:", error);
    if (error instanceof Error && error.message.includes("FOREIGN KEY")) {
      return false;
    }
    throw new Error("Failed to delete customer from database");
  }
}

// ============================================================================
// BANKS
// ============================================================================

export async function api_listBanks(): Promise<Bank[]> {
  try {
    const rows = await getDb().select().from(banks).orderBy(banks.created_at);

    const toISO = (value: unknown) => {
      if (!value) return new Date().toISOString();
      if (typeof value === "string") return value;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "object" && "toISOString" in value)
        return (value as { toISOString: () => string }).toISOString();
      return new Date(String(value)).toISOString();
    };

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: toISO(row.created_at),
      updatedAt: toISO(row.updated_at),
    }));
  } catch (error) {
    console.error("Failed to list banks:", error);
    throw new Error("Failed to load banks from database");
  }
}

export async function api_getBank(id: string): Promise<Bank | undefined> {
  try {
    const rows = await getDb().select().from(banks).where(eq(banks.id, id)).limit(1);

    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];
    if (!row) return undefined;

    // Safe timestamp conversion
    const toISO = (value: unknown) => {
      if (!value) return new Date().toISOString();
      if (typeof value === "string") return value;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "object" && "toISOString" in value)
        return (value as { toISOString: () => string }).toISOString();
      return new Date(String(value)).toISOString();
    };

    return {
      id: row.id,
      name: row.name,
      createdAt: toISO(row.created_at),
      updatedAt: toISO(row.updated_at),
    };
  } catch (error) {
    console.error("Failed to get bank:", error);
    throw new Error("Failed to load bank from database");
  }
}

export async function api_createBank(name: string): Promise<Bank> {
  try {
    const now = new Date();
    const rows = await getDb()
      .insert(banks)
      .values({ name, created_at: now, updated_at: now })
      .returning();

    if (!rows || rows.length === 0) throw new Error("Failed to retrieve created bank");
    const row = rows[0];
    if (!row) throw new Error("Failed to retrieve created bank");

    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  } catch (error) {
    console.error("Failed to create bank:", error);
    throw new Error("Failed to create bank in database");
  }
}

export async function api_updateBank(id: string, name: string): Promise<Bank | undefined> {
  try {
    const existing = await getDb().select().from(banks).where(eq(banks.id, id)).limit(1);

    if (!existing || existing.length === 0) return undefined;

    const now = new Date();
    const rows = await getDb()
      .update(banks)
      .set({ name, updated_at: now })
      .where(eq(banks.id, id))
      .returning();

    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];
    if (!row) return undefined;

    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  } catch (error) {
    console.error("Failed to update bank:", error);
    throw new Error("Failed to update bank in database");
  }
}

export async function api_deleteBank(id: string): Promise<boolean> {
  await requireServerUser("SUPER_ADMIN");
  try {
    await getDb().delete(banks).where(eq(banks.id, id));
    return true;
  } catch (error) {
    console.error("Failed to delete bank:", error);
    if (error instanceof Error && error.message.includes("FOREIGN KEY")) {
      return false;
    }
    throw new Error("Failed to delete bank from database");
  }
}

// ============================================================================
// BRANCHES
// ============================================================================

export async function api_listBranches(): Promise<Branch[]> {
  try {
    const rows = await getDb().select().from(branches).orderBy(branches.created_at);

    const toISO = (value: unknown) => {
      if (!value) return new Date().toISOString();
      if (typeof value === "string") return value;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "object" && "toISOString" in value)
        return (value as { toISOString: () => string }).toISOString();
      return new Date(String(value)).toISOString();
    };

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: toISO(row.created_at),
      updatedAt: toISO(row.updated_at),
    }));
  } catch (error) {
    console.error("Failed to list branches:", error);
    throw new Error("Failed to load branches from database");
  }
}

export async function api_getBranch(id: string): Promise<Branch | undefined> {
  try {
    const rows = await getDb().select().from(branches).where(eq(branches.id, id)).limit(1);

    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];
    if (!row) return undefined;

    // Safe timestamp conversion
    const toISO = (value: unknown) => {
      if (!value) return new Date().toISOString();
      if (typeof value === "string") return value;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "object" && "toISOString" in value)
        return (value as { toISOString: () => string }).toISOString();
      return new Date(String(value)).toISOString();
    };

    return {
      id: row.id,
      name: row.name,
      createdAt: toISO(row.created_at),
      updatedAt: toISO(row.updated_at),
    };
  } catch (error) {
    console.error("Failed to get branch:", error);
    throw new Error("Failed to load branch from database");
  }
}

export async function api_createBranch(name: string): Promise<Branch> {
  try {
    const now = new Date();
    const rows = await getDb()
      .insert(branches)
      .values({ name, created_at: now, updated_at: now })
      .returning();

    if (!rows || rows.length === 0) throw new Error("Failed to retrieve created branch");
    const row = rows[0];
    if (!row) throw new Error("Failed to retrieve created branch");

    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  } catch (error) {
    console.error("Failed to create branch:", error);
    throw new Error("Failed to create branch in database");
  }
}

export async function api_updateBranch(id: string, name: string): Promise<Branch | undefined> {
  try {
    const existing = await getDb().select().from(branches).where(eq(branches.id, id)).limit(1);

    if (!existing || existing.length === 0) return undefined;

    const now = new Date();
    const rows = await getDb()
      .update(branches)
      .set({ name, updated_at: now })
      .where(eq(branches.id, id))
      .returning();

    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];
    if (!row) return undefined;

    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  } catch (error) {
    console.error("Failed to update branch:", error);
    throw new Error("Failed to update branch in database");
  }
}

export async function api_deleteBranch(id: string): Promise<boolean> {
  await requireServerUser("SUPER_ADMIN");
  try {
    await getDb().delete(branches).where(eq(branches.id, id));
    return true;
  } catch (error) {
    console.error("Failed to delete branch:", error);
    if (error instanceof Error && error.message.includes("FOREIGN KEY")) {
      return false;
    }
    throw new Error("Failed to delete branch from database");
  }
}

// ============================================================================
// CASES
// ============================================================================

/** Map a raw `cases` row to the domain ValuationCase shape (single source). */
function mapCaseRow(row: typeof cases.$inferSelect): ValuationCase {
  // Safe timestamp conversion - handle Date objects, strings, or other types
  const toISO = (value: unknown) => {
    if (!value) return new Date().toISOString();
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object" && "toISOString" in value)
      return (value as { toISOString: () => string }).toISOString();
    return new Date(String(value)).toISOString();
  };

  return {
    id: row.id,
    caseNumber: row.case_number,
    requestNumber: row.request_number,
    customerId: row.customer_id,
    bankId: row.bank_id,
    branchId: row.branch_id,
    assignedEngineerId: row.assigned_engineer_id || "",
    assignedMakerId: row.assigned_maker_id || "",
    assignedByCheckerId: row.assigned_by_checker_id || "",
    checkedById: row.checked_by_id || "",
    uploadedById: row.uploaded_by_id || "",
    stage: row.stage as ValuationCase["stage"],
    createdById: row.created_by_id || "",
    createdAt: toISO(row.created_at),
    updatedAt: toISO(row.updated_at),
  };
}

export async function api_listCases(): Promise<ValuationCase[]> {
  try {
    const rows = await getDb().select().from(cases).orderBy(cases.created_at);
    return rows.map(mapCaseRow);
  } catch (error) {
    console.error("Failed to list cases:", error);
    throw new Error("Failed to load cases from database");
  }
}

export async function api_getCase(id: string): Promise<ValuationCase | undefined> {
  try {
    const rows = await getDb().select().from(cases).where(eq(cases.id, id)).limit(1);

    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];
    if (!row) return undefined;

    return mapCaseRow(row);
  } catch (error) {
    console.error("Failed to get case:", error);
    throw new Error("Failed to load case from database");
  }
}

export async function api_createCase(data: {
  requestNumber: string;
  customerId: string;
  bankId: string;
  branchId: string;
  assignedEngineerId: string;
  createdById: string;
}): Promise<ValuationCase> {
  try {
    const now = new Date();

    // Generate case number (VAL-YYYY-NNNN format)
    const year = new Date().getFullYear();
    const prefix = `VAL-${year}-`;
    const allCases = await getDb().select().from(cases);
    const maxSeq = allCases
      .filter((c) => c.case_number.startsWith(prefix))
      .reduce((max, c) => {
        const seq = parseInt(c.case_number.slice(prefix.length), 10);
        return Number.isFinite(seq) && seq > max ? seq : max;
      }, 0);
    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    const caseNumber = `${prefix}${nextSeq}`;

    const rows = await getDb()
      .insert(cases)
      .values({
        case_number: caseNumber,
        request_number: data.requestNumber,
        customer_id: data.customerId,
        bank_id: data.bankId,
        branch_id: data.branchId,
        assigned_engineer_id: data.assignedEngineerId,
        // A new case is assigned to a site engineer up front, so it starts
        // waiting on the field visit rather than sitting in a generic
        // "assigned" state. Advances to FIELD_VISIT_SUBMITTED on submission.
        stage: "FIELD_VISIT_PENDING",
        created_by_id: data.createdById,
        created_at: now,
        updated_at: now,
      })
      .returning();

    if (!rows || rows.length === 0) throw new Error("Failed to retrieve created case");
    const row = rows[0];
    if (!row) throw new Error("Failed to retrieve created case");

    return mapCaseRow(row);
  } catch (error) {
    console.error("Failed to create case:", error);
    throw new Error("Failed to create case in database");
  }
}

export async function api_updateCase(
  id: string,
  data: {
    requestNumber?: string;
    customerId?: string;
    bankId?: string;
    branchId?: string;
    assignedEngineerId?: string;
    stage?: string;
  },
): Promise<ValuationCase | undefined> {
  try {
    const existing = await getDb().select().from(cases).where(eq(cases.id, id)).limit(1);

    if (!existing || existing.length === 0) return undefined;

    const now = new Date();
    const updateData: Partial<typeof cases.$inferInsert> = { updated_at: now };

    if (data.requestNumber !== undefined) updateData.request_number = data.requestNumber;
    if (data.customerId !== undefined) updateData.customer_id = data.customerId;
    if (data.bankId !== undefined) updateData.bank_id = data.bankId;
    if (data.branchId !== undefined) updateData.branch_id = data.branchId;
    if (data.assignedEngineerId !== undefined)
      updateData.assigned_engineer_id = data.assignedEngineerId;
    if (data.stage !== undefined) updateData.stage = data.stage;

    const rows = await getDb().update(cases).set(updateData).where(eq(cases.id, id)).returning();

    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];
    if (!row) return undefined;

    return mapCaseRow(row);
  } catch (error) {
    console.error("Failed to update case:", error);
    throw new Error("Failed to update case in database");
  }
}

export async function api_deleteCase(id: string): Promise<boolean> {
  try {
    await getDb().delete(cases).where(eq(cases.id, id));
    return true;
  } catch (error) {
    console.error("Failed to delete case:", error);
    if (error instanceof Error && error.message.includes("FOREIGN KEY")) {
      return false;
    }
    throw new Error("Failed to delete case from database");
  }
}

/**
 * List the cases assigned to the currently authenticated Site Engineer.
 *
 * The caller passes a Neon Auth JWT (not a user id). The server VERIFIES the
 * token's signature against Neon Auth's JWKS (see requireServerUser) and derives
 * the engineer's id from the verified `sub` claim. This is the security boundary: a
 * SITE_ENGINEER can only ever receive cases where assigned_engineer_id equals
 * their own verified user id, and cannot forge a token for another engineer to
 * view someone else's cases. Only SITE_ENGINEER sessions are permitted here.
 */
export async function api_listMyCases(token: string | null | undefined): Promise<ValuationCase[]> {
  const user = await requireServerUser(token, "SITE_ENGINEER");

  try {
    const rows = await getDb()
      .select()
      .from(cases)
      .where(eq(cases.assigned_engineer_id, user.id))
      .orderBy(cases.created_at);

    return rows.map(mapCaseRow);
  } catch (error) {
    console.error("Failed to list my cases:", error);
    throw new Error("Failed to load your cases from database");
  }
}

// ============================================================================
// CHECKER QUEUE + MAKER ASSIGNMENT
// ============================================================================
//
// Security model mirrors api_listMyCases: the caller passes a Neon Auth session
// TOKEN (a credential), never a user id or role. requireServerUser verifies the
// token against Neon Auth's JWKS and reads the authoritative app role from
// neon_auth."user". The browser can neither forge a role nor supply another
// user's id as the authority.

/** Stages a case can be in once it is eligible for the Checker queue. */
const CHECKER_QUEUE_STAGES = [
  "FIELD_VISIT_SUBMITTED",
  "MAKER_ASSIGNED",
  // Maker has submitted the case back for the Checker's review of the report.
  "CHECKER_PENDING",
] as const;

/**
 * List the cases visible to a Checker: every case whose field visit has been
 * submitted and is ready for Maker assignment/review. This is intentionally
 * NOT filtered by checker user id — all Checkers see the same eligible cases.
 * Admins/Super Admins are also allowed so their existing access keeps working.
 */
export async function api_listCheckerCases(
  token: string | null | undefined,
): Promise<(ValuationCase & { customerName?: string; bankName?: string; branchName?: string })[]> {
  await requireServerUser(token, "CHECKER", "ADMIN", "SUPER_ADMIN");

  try {
    const rows = await getDb()
      .select({
        case: cases,
        customerName: customers.name,
        bankName: banks.name,
        branchName: branches.name,
      })
      .from(cases)
      .leftJoin(customers, eq(cases.customer_id, customers.id))
      .leftJoin(banks, eq(cases.bank_id, banks.id))
      .leftJoin(branches, eq(cases.branch_id, branches.id))
      .where(inArray(cases.stage, [...CHECKER_QUEUE_STAGES]))
      .orderBy(cases.created_at);

    return rows.map((row) => {
      const baseCase = mapCaseRow(row.case);
      return {
        ...baseCase,
        customerName: row.customerName || undefined,
        bankName: row.bankName || undefined,
        branchName: row.branchName || undefined,
      } as ValuationCase & { customerName?: string; bankName?: string; branchName?: string };
    });
  } catch (error) {
    console.error("Failed to list checker cases:", error);
    throw new Error("Failed to load checker cases from database");
  }
}

/**
 * List the cases assigned to the currently authenticated Maker.
 *
 * The trusted maker id comes from the verified token's `sub` claim, never from
 * a client-supplied field, so a Maker can only ever see cases where
 * assigned_maker_id equals their own verified id. Only MAKER sessions permitted.
 */
export async function api_listMakerCases(
  token: string | null | undefined,
): Promise<ValuationCase[]> {
  const user = await requireServerUser(token, "MAKER");

  try {
    const rows = await getDb()
      .select()
      .from(cases)
      .where(eq(cases.assigned_maker_id, user.id))
      .orderBy(cases.created_at);

    return rows.map(mapCaseRow);
  } catch (error) {
    console.error("Failed to list maker cases:", error);
    throw new Error("Failed to load your cases from database");
  }
}

/**
 * Stages in which a Maker may be (re)assigned — i.e. the field visit has been
 * submitted and the case has not moved past Maker assignment. Assignment is
 * meaningless before submission and we do not touch cases further down the
 * pipeline here.
 */
const MAKER_ASSIGNABLE_STAGES = ["FIELD_VISIT_SUBMITTED", "MAKER_ASSIGNED"] as const;

/**
 * Assign (or, for admins, reassign) a Maker to a case. This is the
 * authoritative, server-enforced action — the UI is never the gate.
 *
 * Role rules, enforced from the verified Neon Auth application role:
 *   - CHECKER      : may assign a Maker ONLY when no Maker is currently
 *                    assigned and the field visit is submitted. A Checker can
 *                    NEVER change/reassign an existing Maker.
 *   - ADMIN        : may assign when unassigned AND may reassign/change an
 *   - SUPER_ADMIN    existing Maker at any time (once the field visit is in).
 *   - MAKER / SITE_ENGINEER / others : cannot assign or reassign at all
 *                    (rejected by requireServerUser below).
 *
 * The rule is applied as a single conditional UPDATE whose WHERE clause encodes
 * the caller's permission, so a race cannot slip an unauthorized change
 * through. When the update matches no rows we re-read the case to return a
 * precise, non-leaky error.
 */
export async function api_assignMaker(
  token: string | null | undefined,
  caseId: string,
  makerId: string,
): Promise<ValuationCase> {
  // Only these roles may assign/reassign. Makers and site engineers are
  // rejected here. We keep the resolved user to record who assigned and to
  // branch the reassignment rule on the real role.
  const actor = await requireServerUser(token, "CHECKER", "ADMIN", "SUPER_ADMIN");
  const canReassign = actor.role === "ADMIN" || actor.role === "SUPER_ADMIN";

  // Validate the target is a real, non-banned MAKER before assigning.
  const maker = await api_getMaker(makerId);
  if (!maker) {
    throw new Error("Selected user is not a valid Maker");
  }

  try {
    const now = new Date();

    // Base guard for everyone: the case must be at a stage where Maker
    // assignment is valid (field visit submitted, not further down the line).
    const stageGuard = inArray(cases.stage, [...MAKER_ASSIGNABLE_STAGES]);

    // A Checker may only act when NO Maker is assigned yet. Admins/Super Admins
    // may act whether or not a Maker is already assigned (reassignment). This
    // extra predicate is the real enforcement of "Checker cannot reassign".
    const whereClause = canReassign
      ? and(eq(cases.id, caseId), stageGuard)
      : and(eq(cases.id, caseId), stageGuard, sql`${cases.assigned_maker_id} IS NULL`);

    const rows = await getDb()
      .update(cases)
      .set({
        assigned_maker_id: makerId,
        assigned_by_checker_id: actor.id,
        stage: "MAKER_ASSIGNED",
        updated_at: now,
      })
      .where(whereClause)
      .returning();

    const row = rows[0];
    if (row) {
      return mapCaseRow(row);
    }

    // The update matched nothing — figure out why so the UI can show a useful
    // message, without leaking anything the caller shouldn't see.
    const existing = await getDb().select().from(cases).where(eq(cases.id, caseId)).limit(1);
    const current = existing[0];
    if (!current) {
      throw new Error("Case not found");
    }
    if (!(MAKER_ASSIGNABLE_STAGES as readonly string[]).includes(current.stage)) {
      throw new Error("This case is not ready for Maker assignment");
    }
    // Reached only for a Checker hitting an already-assigned case: reassignment
    // is an admin-only action, so the Checker is refused server-side.
    if (!canReassign && current.assigned_maker_id) {
      throw new Error("A Maker is already assigned. Only an admin can reassign it.");
    }
    // Should be unreachable, but never claim success without a row.
    throw new Error("Failed to assign Maker");
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error("Failed to assign maker:", error);
    throw new Error("Failed to assign Maker in database");
  }
}

/**
 * Reassign the Site Engineer for a case that has not started a Field Visit.
 * Only admins may perform this action; the verified token is the authority.
 * The original field_visits.engineer_id is intentionally never changed.
 *
 * The case row is locked for the whole decision/update. Field-visit submission
 * takes the same lock before checking ownership and inserting its visit, so
 * exactly one operation wins when submission and reassignment overlap.
 */
export async function api_reassignSiteEngineer(
  token: string | null | undefined,
  caseId: string,
  engineerId: string,
): Promise<ValuationCase> {
  await requireServerUser(token, "ADMIN", "SUPER_ADMIN");

  // Validate the target against the authoritative Neon Auth table, including
  // active status. The picker is only a convenience and can be stale.
  const targetRows = await getDb().execute(
    sql`SELECT id
        FROM neon_auth."user"
        WHERE id = ${engineerId}
          AND role = 'SITE_ENGINEER'
          AND banned IS NOT TRUE
        LIMIT 1`,
  );
  if (!(targetRows as unknown as { id: string }[])[0]) {
    throw new Error("Selected user is not an active Site Engineer");
  }

  try {
    const row = await getDb().transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM cases WHERE id = ${caseId} FOR UPDATE`);

      const visit = await tx
        .select({ status: fieldVisits.status })
        .from(fieldVisits)
        .where(eq(fieldVisits.case_id, caseId))
        .limit(1);
      if (visit[0]?.status === "SUBMITTED") {
        throw new Error("Site Engineer reassignment is unavailable after field visit submission");
      }

      const now = new Date();
      const rows = await tx
        .update(cases)
        .set({ assigned_engineer_id: engineerId, updated_at: now })
        .where(
          and(
            eq(cases.id, caseId),
            inArray(cases.stage, ["ASSIGNED", "FIELD_VISIT_PENDING"]),
            sql`${cases.assigned_engineer_id} IS NOT NULL`,
            sql`${cases.assigned_engineer_id} <> ${engineerId}`,
          ),
        )
        .returning();

      const updated = rows[0];
      if (updated) return updated;

      const current = await tx.select().from(cases).where(eq(cases.id, caseId)).limit(1);
      const caseRow = current[0];
      if (!caseRow) throw new Error("Case not found");
      if (!("ASSIGNED" === caseRow.stage || "FIELD_VISIT_PENDING" === caseRow.stage)) {
        throw new Error("Site Engineer reassignment is unavailable after field visit submission");
      }
      if (caseRow.assigned_engineer_id === engineerId) {
        throw new Error("The selected Site Engineer is already assigned");
      }
      throw new Error("Site Engineer reassignment conflicted with another case update");
    });

    return mapCaseRow(row);
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error("Failed to reassign site engineer:", error);
    throw new Error("Failed to reassign Site Engineer in database");
  }
}

// ============================================================================
// FIELD VISITS
// ============================================================================
//
// Security model (mirrors api_listMyCases): the caller passes a Neon Auth
// session TOKEN, never a user id. requireServerUser verifies the token against
// Neon Auth's JWKS and derives the engineer id from the verified `sub` claim.
// Before any Field Visit read/write we re-load the Case and assert that its
// assigned_engineer_id equals the authenticated engineer's id, so an engineer
// can only ever touch a Field Visit for a Case assigned to them.

function mapFieldVisitRow(row: typeof fieldVisits.$inferSelect): FieldVisit {
  const visit: FieldVisit = {
    id: row.id,
    caseId: row.case_id,
    engineerId: row.engineer_id,
    floor: row.floor,
    building: row.building,
    ageOfBuilding: row.age_of_building,
    sqFeet: row.sq_feet,
    status: row.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
    createdAt: (() => {
      const v = row.created_at;
      if (!v) return new Date().toISOString();
      if (typeof v === "string") return v;
      if (v instanceof Date) return v.toISOString();
      if (typeof v === "object" && "toISOString" in v)
        return (v as { toISOString: () => string }).toISOString();
      return new Date(String(v)).toISOString();
    })(),
    updatedAt: (() => {
      const v = row.updated_at;
      if (!v) return new Date().toISOString();
      if (typeof v === "string") return v;
      if (v instanceof Date) return v.toISOString();
      if (typeof v === "object" && "toISOString" in v)
        return (v as { toISOString: () => string }).toISOString();
      return new Date(String(v)).toISOString();
    })(),
  };
  if (row.submitted_at) {
    const v = row.submitted_at;
    visit.submittedAt =
      typeof v === "string"
        ? v
        : v instanceof Date
          ? v.toISOString()
          : new Date(String(v)).toISOString();
  }
  if (row.updated_by_id) visit.updatedById = row.updated_by_id;
  if (row.checker_updated_by_id) visit.checkerUpdatedById = row.checker_updated_by_id;

  // Expanded report fields — only surface those that are populated so a
  // basic-version row (all new columns null) maps back to just the originals.
  if (row.visit_date != null) visit.visitDate = row.visit_date;
  if (row.gps_latitude != null) visit.gpsLatitude = String(row.gps_latitude);
  if (row.gps_longitude != null) visit.gpsLongitude = String(row.gps_longitude);

  if (row.person_met != null) visit.personMet = row.person_met;
  if (row.person_phone != null) visit.personPhone = row.person_phone;
  if (row.relationship != null) visit.relationship = row.relationship;
  if (row.other_relationship != null) visit.otherRelationship = row.other_relationship;
  if (row.other_relationship_remarks != null)
    visit.relationshipRemarks = row.other_relationship_remarks;

  if (row.landmark != null) visit.landmark = row.landmark;
  if (row.property_type != null) visit.propertyType = row.property_type;
  if (row.property_type_remarks != null) visit.propertyTypeRemarks = row.property_type_remarks;
  if (row.locality_type != null) visit.localityType = row.locality_type;
  if (row.occupancy_status != null) visit.occupancyStatus = row.occupancy_status;
  if (row.occupancy_status_remarks != null)
    visit.occupancyStatusRemarks = row.occupancy_status_remarks;
  if (row.occupancy_with_name != null) visit.occupancyWithName = row.occupancy_with_name;
  if (row.full_address != null) visit.fullAddress = row.full_address;
  if (row.year_of_living != null) visit.yearOfLiving = row.year_of_living;

  if (row.structure_type != null) visit.structureType = row.structure_type;
  if (row.structure_type_remarks != null) visit.structureTypeRemarks = row.structure_type_remarks;
  if (row.occupancy_level != null) visit.occupancyLevel = row.occupancy_level;
  if (row.floors_in_building != null) visit.floorsInBuilding = row.floors_in_building;
  if (row.located_on_floor != null) visit.locatedOnFloor = row.located_on_floor;
  if (row.flats_on_floor != null) visit.flatsOnFloor = row.flats_on_floor;
  if (row.wings_in_building != null) visit.wingsInBuilding = row.wings_in_building;
  if (row.lifts_staircases != null) visit.liftsStaircases = row.lifts_staircases;

  if (row.year_of_construction != null) visit.yearOfConstruction = row.year_of_construction;
  if (row.construction_stage != null) visit.constructionStage = row.construction_stage;
  if (row.work_description != null) visit.workDescription = row.work_description;
  if (row.flat_identification != null) visit.flatIdentification = row.flat_identification;
  if (row.plot_demarcation != null) visit.plotDemarcation = row.plot_demarcation;
  if (row.no_of_labor != null) visit.noOfLabor = row.no_of_labor;
  if (row.material_at_site != null) visit.materialAtSite = row.material_at_site;

  if (row.boundary_east != null) visit.boundaryEast = row.boundary_east;
  if (row.boundary_west != null) visit.boundaryWest = row.boundary_west;
  if (row.boundary_north != null) visit.boundaryNorth = row.boundary_north;
  if (row.boundary_south != null) visit.boundarySouth = row.boundary_south;

  if (row.approach_road_condition != null)
    visit.approachRoadCondition = row.approach_road_condition;
  if (row.width_of_approach_road != null) visit.widthOfApproachRoad = row.width_of_approach_road;
  if (row.remarks_approach_road != null) visit.remarksApproachRoad = row.remarks_approach_road;
  if (row.society_name_board != null) visit.societyNameBoard = row.society_name_board;
  if (row.area_sqft != null) visit.areaSqFt = String(row.area_sqft);
  if (row.area_basis != null) visit.areaBasis = row.area_basis;
  if (row.rate_basis != null) visit.rateBasis = row.rate_basis as any;
  if (row.rate_per_sqft != null) visit.ratePerSqFt = row.rate_per_sqft;
  if (row.rent_per_month != null) visit.rentPerMonth = row.rent_per_month;
  if (row.area_basis != null) visit.areaBasis = row.area_basis;
  if (row.negative_points != null) visit.negativePoints = row.negative_points;
  if (row.agent_opinion != null) visit.agentOpinion = row.agent_opinion;

  if (row.final_remarks != null) visit.finalRemarks = row.final_remarks;

  return visit;
}

/**
 * Load the Case and confirm it is assigned to the authenticated engineer.
 * Throws "Not authenticated" / "Forbidden" (via requireServerUser) or
 * "Forbidden" when the case is not owned by the caller. Returns the verified
 * engineer's id for use as the trusted engineer_id.
 */
async function requireOwnedCase(
  token: string | null | undefined,
  caseId: string,
): Promise<{ engineerId: string }> {
  const user = await requireServerUser(token, "SITE_ENGINEER");

  const rows = await getDb().select().from(cases).where(eq(cases.id, caseId)).limit(1);
  const row = rows[0];
  if (!row) {
    throw new Error("Case not found");
  }
  if (row.assigned_engineer_id !== user.id) {
    // Do not leak whether the case exists for someone else.
    throw new Error("Forbidden");
  }
  return { engineerId: user.id };
}

/**
 * Read the Field Visit for a Case the authenticated engineer owns.
 * Returns undefined when no Field Visit has been created yet.
 */
export async function api_getMyFieldVisit(
  token: string | null | undefined,
  caseId: string,
): Promise<FieldVisit | undefined> {
  await requireOwnedCase(token, caseId);

  try {
    const rows = await getDb()
      .select()
      .from(fieldVisits)
      .where(eq(fieldVisits.case_id, caseId))
      .limit(1);

    const row = rows[0];
    if (!row) return undefined;
    return mapFieldVisitRow(row);
  } catch (error) {
    console.error("Failed to get field visit:", error);
    throw new Error("Failed to load field visit from database");
  }
}

/**
 * Read the Field Visit for a Case by case id, for anyone allowed to view the
 * case detail page (admins, maker, checker, and the owning site engineer).
 *
 * Unlike api_getMyFieldVisit, this does NOT enforce SITE_ENGINEER ownership:
 * it mirrors api_getCase, which performs no token/role check and relies on the
 * route guard (`requirePermission("cases.detail")`) as the authorization
 * boundary. The read is keyed only on case_id (UNIQUE), so a case has at most
 * one visit. Returns undefined when no Field Visit exists yet.
 */
export async function api_getCaseFieldVisit(caseId: string): Promise<FieldVisit | undefined> {
  try {
    const rows = await getDb()
      .select()
      .from(fieldVisits)
      .where(eq(fieldVisits.case_id, caseId))
      .limit(1);

    const row = rows[0];
    if (!row) return undefined;
    return mapFieldVisitRow(row);
  } catch (error) {
    console.error("Failed to get case field visit:", error);
    throw new Error("Failed to load field visit from database");
  }
}

/**
 * Submit the Field Visit for a Case the authenticated engineer owns.
 *
 * Creates the Field Visit as SUBMITTED (this first version has no separate
 * draft-save step; submission is the single write). The UNIQUE constraint on
 * case_id plus an explicit pre-check prevent duplicate Field Visits: once a
 * Field Visit exists for the Case, it is treated as submitted/read-only and
 * re-submission is rejected.
 */
export async function api_submitFieldVisit(
  token: string | null | undefined,
  caseId: string,
  input: unknown,
): Promise<FieldVisit> {
  const user = await requireServerUser(token, "SITE_ENGINEER");
  const engineerId = user.id;

  // Re-validate on the server: the browser is never the only gatekeeper.
  const data = fieldVisitFormSchema.parse(input);

  // Lock the case until both the visit insert and case-stage update complete.
  // Reassignment takes this same lock, preventing either operation from
  // observing a partially completed submission.
  try {
    const visit = await getDb().transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM cases WHERE id = ${caseId} FOR UPDATE`);

      const ownedCase = await tx
        .select({ assigned_engineer_id: cases.assigned_engineer_id })
        .from(cases)
        .where(eq(cases.id, caseId))
        .limit(1);
      const caseRow = ownedCase[0];
      if (!caseRow) throw new Error("Case not found");
      if (caseRow.assigned_engineer_id !== engineerId) throw new Error("Forbidden");

      // Reject a second submission for the same Case (idempotency / no duplicates).
      const existing = await tx
        .select()
        .from(fieldVisits)
        .where(eq(fieldVisits.case_id, caseId))
        .limit(1);
      if (existing[0]) {
        throw new Error("A field visit has already been submitted for this case");
      }

      const now = new Date();

      // Date of visit is device/server time, not client-supplied. Store as a
      // YYYY-MM-DD date string for the `date` column.
      const visitDate = now.toISOString().slice(0, 10);

      // Populate the original NOT NULL columns from the expanded report so the
      // existing schema and any consumers of those fields keep working. These
      // are derived, never asked of the engineer twice.
      const legacyFloor = data.locatedOnFloor;
      const legacyBuilding = data.landmark.slice(0, 255);
      const legacyAge =
        data.yearOfConstruction && Number(data.yearOfConstruction) > 0
          ? String(Math.max(0, now.getFullYear() - Number(data.yearOfConstruction)))
          : "0";
      const legacySqFeet = data.areaSqFt;

      const rows = await tx
        .insert(fieldVisits)
        .values({
          case_id: caseId,
          engineer_id: engineerId,

          // Preserved original columns (derived from the expanded fields).
          floor: legacyFloor,
          building: legacyBuilding,
          age_of_building: legacyAge,
          sq_feet: legacySqFeet,

          // Device-captured (server-trusted date; client-captured GPS).
          visit_date: visitDate,
          gps_latitude: String(data.gpsLatitude),
          gps_longitude: String(data.gpsLongitude),

          // STEP 1
          person_met: data.personMet,
          person_phone: data.personPhone,
          relationship: data.relationship,
          other_relationship: data.otherRelationship ? data.otherRelationship : null,
          other_relationship_remarks: data.relationshipRemarks
            ? data.relationshipRemarks
            : null,

          // STEP 2
          full_address: data.fullAddress ? data.fullAddress : null,
          landmark: data.landmark,
          property_type: data.propertyType,
          property_type_remarks: data.propertyTypeRemarks ? data.propertyTypeRemarks : null,
          locality_type: data.localityType,
          occupancy_status: data.occupancyStatus,
          occupancy_status_remarks: data.occupancyStatusRemarks
            ? data.occupancyStatusRemarks
            : null,
          occupancy_with_name: data.occupancyWithName ? data.occupancyWithName : null,
          year_of_living: data.yearOfLiving ? data.yearOfLiving : null,

          // STEP 3
          structure_type: data.structureType,
          structure_type_remarks: data.structureTypeRemarks ? data.structureTypeRemarks : null,
          occupancy_level: data.occupancyLevel,
          floors_in_building: data.floorsInBuilding,
          located_on_floor: data.locatedOnFloor,
          flats_on_floor: data.flatsOnFloor,
          wings_in_building: data.wingsInBuilding,
          lifts_staircases: data.liftsStaircases,

          // STEP 4
          year_of_construction: Number(data.yearOfConstruction),
          construction_stage: data.constructionStage,
          work_description: data.workDescription ? data.workDescription : null,
          flat_identification: data.flatIdentification ? data.flatIdentification : null,
          plot_demarcation: data.plotDemarcation ? data.plotDemarcation : null,
          no_of_labor: data.noOfLabor ? data.noOfLabor : null,
          material_at_site: data.materialAtSite ? data.materialAtSite : null,

          // STEP 5
          boundary_east: data.boundaryEast,
          boundary_west: data.boundaryWest,
          boundary_north: data.boundaryNorth,
          boundary_south: data.boundarySouth,

          // STEP 6
          approach_road_condition: data.approachRoadCondition,
          width_of_approach_road: data.widthOfApproachRoad ? data.widthOfApproachRoad : null,
          remarks_approach_road: data.remarksApproachRoad ? data.remarksApproachRoad : null,
          society_name_board: data.societyNameBoard ? data.societyNameBoard : null,
          area_sqft: data.areaSqFt && data.areaSqFt.trim() ? data.areaSqFt : null,
          area_basis: data.areaBasis ? data.areaBasis : null,
          rate_basis: data.rateBasis ? data.rateBasis : null,
          rate_per_sqft: data.ratePerSqFt ? data.ratePerSqFt : null,
          rent_per_month: data.rentPerMonth ? data.rentPerMonth : null,
          negative_points: data.negativePoints ? data.negativePoints : null,
          agent_opinion: data.agentOpinion ? data.agentOpinion : null,

          // STEP 7
          final_remarks: data.finalRemarks ? data.finalRemarks : null,

          status: "SUBMITTED",
          created_at: now,
          updated_at: now,
          submitted_at: now,
        })
        .returning();

      const row = rows[0];
      if (!row) throw new Error("Failed to retrieve created field visit");

      // Advance the case stage now that the field visit is in. Only move forward
      // from the pre-submission stages so we never drag a case that has already
      // progressed (maker/checker/etc.) back to FIELD_VISIT_SUBMITTED.
      await tx
        .update(cases)
        .set({ stage: "FIELD_VISIT_SUBMITTED", updated_at: now })
        .where(
          and(eq(cases.id, caseId), inArray(cases.stage, ["ASSIGNED", "FIELD_VISIT_PENDING"])),
        );

      // Always refresh the case's "last updated" timestamp on submission, even if
      // the stage guard above didn't match (e.g. the case had already advanced).
      await tx.update(cases).set({ updated_at: now }).where(eq(cases.id, caseId));

      return mapFieldVisitRow(row);
    });
    return visit;
  } catch (error) {
    // A race that slips past the pre-check still hits the UNIQUE constraint.
    if (error instanceof Error && error.message.includes("field_visits_case_id")) {
      throw new Error("A field visit has already been submitted for this case");
    }
    console.error("Failed to submit field visit - Full error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(
      `Failed to submit field visit to database: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Stages during which the assigned Maker may edit a submitted Field Visit.
 * Editing is a review-time correction, not a workflow advance, so it is only
 * permitted while the case sits with the Maker. Once the case moves on
 * (checker/uploader/completed) the visit is frozen again.
 */
const MAKER_EDITABLE_STAGES = ["MAKER_ASSIGNED", "MAKER_PENDING"] as const;

/**
 * Authorize a Maker to act on a Case's Field Visit and return the verified
 * maker id. Enforced entirely from the trusted Neon Auth role + the DB row,
 * never from anything the client asserts:
 *   - caller must be a MAKER (requireServerUser rejects everyone else);
 *   - the case must exist;
 *   - the case's assigned_maker_id must equal the authenticated maker's id;
 *   - the case must be at a Maker-editable stage.
 * Mirrors requireOwnedCase (the site-engineer guard) but for the Maker side.
 */
async function requireMakerCase(
  token: string | null | undefined,
  caseId: string,
): Promise<{ makerId: string }> {
  const user = await requireServerUser(token, "MAKER");

  const rows = await getDb().select().from(cases).where(eq(cases.id, caseId)).limit(1);
  const row = rows[0];
  if (!row) {
    throw new Error("Case not found");
  }
  if (row.assigned_maker_id !== user.id) {
    // Do not leak whether the case exists for someone else.
    throw new Error("Forbidden");
  }
  if (!(MAKER_EDITABLE_STAGES as readonly string[]).includes(row.stage)) {
    throw new Error("This case is not in a stage where the field visit can be edited");
  }
  return { makerId: user.id };
}

/**
 * Edit an already-submitted Field Visit as the assigned Maker.
 *
 * This is deliberately separate from api_submitFieldVisit: submission is the
 * site engineer's one-time create; this is the Maker's review-time correction.
 * It re-validates the full payload with the SAME Zod schema the engineer used,
 * so every rule (required fields, ranges, cross-field checks) is respected.
 *
 * What it changes: all STEP 1–7 report fields plus the derived legacy columns,
 * `updated_at`, and `updated_by_id` (the editing Maker). What it deliberately
 * NEVER touches: `engineer_id`, `created_at`, `submitted_at`, `status`, the
 * device-captured `visit_date`, and the GPS coordinates — GPS is the site
 * engineer's on-site capture and is not editable from the desk.
 */
export async function api_updateFieldVisit(
  token: string | null | undefined,
  caseId: string,
  input: unknown,
): Promise<FieldVisit> {
  const { makerId } = await requireMakerCase(token, caseId);

  // Re-validate on the server with the same schema as submission.
  const data = fieldVisitFormSchema.parse(input);

  // The visit must already exist and be submitted; there is nothing to edit
  // otherwise (a Maker never creates a visit, only corrects a submitted one).
  const existingRows = await getDb()
    .select()
    .from(fieldVisits)
    .where(eq(fieldVisits.case_id, caseId))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    throw new Error("No field visit exists for this case");
  }
  if (existing.status !== "SUBMITTED") {
    throw new Error("Field visit has not been submitted yet");
  }

  try {
    const now = new Date();

    // Re-derive the legacy NOT NULL columns from the edited report the same
    // way submission does, so those columns stay consistent with the fields
    // the Maker just changed. `year_of_construction` drives the derived age.
    const legacyFloor = data.locatedOnFloor;
    const legacyBuilding = data.landmark.slice(0, 255);
    const legacyAge =
      data.yearOfConstruction && Number(data.yearOfConstruction) > 0
        ? String(Math.max(0, now.getFullYear() - Number(data.yearOfConstruction)))
        : "0";
    const legacySqFeet = data.areaSqFt;

    const rows = await getDb()
      .update(fieldVisits)
      .set({
        // Preserved original columns (derived from the expanded fields).
        floor: legacyFloor,
        building: legacyBuilding,
        age_of_building: legacyAge,
        sq_feet: legacySqFeet,

        // STEP 1 (GPS intentionally NOT updated — on-site capture is fixed).
        person_met: data.personMet,
        person_phone: data.personPhone,
        relationship: data.relationship,
        other_relationship: data.otherRelationship ? data.otherRelationship : null,
        other_relationship_remarks: data.relationshipRemarks
          ? data.relationshipRemarks
          : null,

        // STEP 2
        full_address: data.fullAddress ? data.fullAddress : null,
        landmark: data.landmark,
        property_type: data.propertyType,
        property_type_remarks: data.propertyTypeRemarks ? data.propertyTypeRemarks : null,
        locality_type: data.localityType,
        occupancy_status: data.occupancyStatus,
        occupancy_status_remarks: data.occupancyStatusRemarks ? data.occupancyStatusRemarks : null,
        occupancy_with_name: data.occupancyWithName ? data.occupancyWithName : null,
        year_of_living: data.yearOfLiving ? data.yearOfLiving : null,

        // STEP 3
        structure_type: data.structureType,
        structure_type_remarks: data.structureTypeRemarks ? data.structureTypeRemarks : null,
        occupancy_level: data.occupancyLevel,
        floors_in_building: data.floorsInBuilding,
        located_on_floor: data.locatedOnFloor,
        flats_on_floor: data.flatsOnFloor,
        wings_in_building: data.wingsInBuilding,
        lifts_staircases: data.liftsStaircases,

        // STEP 4
        year_of_construction: Number(data.yearOfConstruction),
        construction_stage: data.constructionStage,
        work_description: data.workDescription ? data.workDescription : null,
        flat_identification: data.flatIdentification ? data.flatIdentification : null,
        plot_demarcation: data.plotDemarcation ? data.plotDemarcation : null,
        no_of_labor: data.noOfLabor ? data.noOfLabor : null,
        material_at_site: data.materialAtSite ? data.materialAtSite : null,

        // STEP 5
        boundary_east: data.boundaryEast,
        boundary_west: data.boundaryWest,
        boundary_north: data.boundaryNorth,
        boundary_south: data.boundarySouth,

        // STEP 6
        approach_road_condition: data.approachRoadCondition,
        width_of_approach_road: data.widthOfApproachRoad ? data.widthOfApproachRoad : null,
        remarks_approach_road: data.remarksApproachRoad ? data.remarksApproachRoad : null,
        society_name_board: data.societyNameBoard ? data.societyNameBoard : null,
        area_sqft: data.areaSqFt && data.areaSqFt.trim() ? data.areaSqFt : null,
        area_basis: data.areaBasis ? data.areaBasis : null,
        rate_basis: data.rateBasis ? data.rateBasis : null,
        rate_per_sqft: data.ratePerSqFt ? data.ratePerSqFt : null,
        rent_per_month: data.rentPerMonth ? data.rentPerMonth : null,
        negative_points: data.negativePoints ? data.negativePoints : null,
        agent_opinion: data.agentOpinion ? data.agentOpinion : null,

        // STEP 7
        final_remarks: data.finalRemarks ? data.finalRemarks : null,

        // Edit attribution — who edited and when. Original creation columns
        // (engineer_id, created_at, submitted_at, status) are left untouched.
        updated_at: now,
        updated_by_id: makerId,
      })
      .where(eq(fieldVisits.case_id, caseId))
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Failed to retrieve updated field visit");

    // Keep the case's last-updated time in sync with the edit. Stage is left
    // as-is — editing the visit is not a workflow transition.
    await getDb().update(cases).set({ updated_at: now }).where(eq(cases.id, caseId));

    return mapFieldVisitRow(row);
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error("Failed to update field visit - Full error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(
      `Failed to update field visit in database: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Edit an already-submitted Field Visit as the assigned Checker during their
 * review stage (CHECKER_PENDING only).
 *
 * Mirrors api_updateFieldVisit exactly except:
 *  - Caller must be CHECKER (requireServerUser rejects everyone else).
 *  - Case must be at CHECKER_PENDING — the Checker's review window.
 *  - Writes checker_updated_by_id instead of updated_by_id, so the Maker's
 *    attribution is never overwritten. Both columns are preserved permanently.
 *  - Does NOT touch updated_by_id, engineer_id, created_at, submitted_at,
 *    status, visit_date, or GPS.
 * Re-validates with the same fieldVisitFormSchema so all rules are respected.
 */
export async function api_updateFieldVisitByChecker(
  token: string | null | undefined,
  caseId: string,
  input: unknown,
): Promise<FieldVisit> {
  const checker = await requireServerUser(token, "CHECKER");

  // Verify the case is at CHECKER_PENDING — the only stage where the Checker
  // may edit. Do not use requireMakerCase (that's MAKER-scoped).
  const caseRows = await getDb().select().from(cases).where(eq(cases.id, caseId)).limit(1);
  const caseRow = caseRows[0];
  if (!caseRow) throw new Error("Case not found");
  if (caseRow.stage !== "CHECKER_PENDING") {
    throw new Error("Field visit can only be edited by the Checker during their review stage");
  }

  // Re-validate with the same schema used at submission and Maker edit.
  const data = fieldVisitFormSchema.parse(input);

  const existingRows = await getDb()
    .select()
    .from(fieldVisits)
    .where(eq(fieldVisits.case_id, caseId))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) throw new Error("No field visit exists for this case");
  if (existing.status !== "SUBMITTED") throw new Error("Field visit has not been submitted yet");

  try {
    const now = new Date();

    const legacyFloor = data.locatedOnFloor;
    const legacyBuilding = data.landmark.slice(0, 255);
    const legacyAge =
      data.yearOfConstruction && Number(data.yearOfConstruction) > 0
        ? String(Math.max(0, now.getFullYear() - Number(data.yearOfConstruction)))
        : "0";
    const legacySqFeet = data.areaSqFt;

    const rows = await getDb()
      .update(fieldVisits)
      .set({
        floor: legacyFloor,
        building: legacyBuilding,
        age_of_building: legacyAge,
        sq_feet: legacySqFeet,

        // STEP 1 (GPS not editable)
        person_met: data.personMet,
        person_phone: data.personPhone,
        relationship: data.relationship,
        other_relationship: data.otherRelationship ? data.otherRelationship : null,
        other_relationship_remarks: data.relationshipRemarks
          ? data.relationshipRemarks
          : null,

        // STEP 2
        full_address: data.fullAddress ? data.fullAddress : null,
        landmark: data.landmark,
        property_type: data.propertyType,
        locality_type: data.localityType,
        occupancy_status: data.occupancyStatus,
        occupancy_with_name: data.occupancyWithName ? data.occupancyWithName : null,
        year_of_living: data.yearOfLiving ? data.yearOfLiving : null,

        // STEP 3
        structure_type: data.structureType,
        occupancy_level: data.occupancyLevel,
        floors_in_building: data.floorsInBuilding,
        located_on_floor: data.locatedOnFloor,
        flats_on_floor: data.flatsOnFloor,
        wings_in_building: data.wingsInBuilding,
        lifts_staircases: data.liftsStaircases,

        // STEP 4
        year_of_construction: Number(data.yearOfConstruction),
        construction_stage: data.constructionStage,
        work_description: data.workDescription ? data.workDescription : null,

        // STEP 5
        boundary_east: data.boundaryEast,
        boundary_west: data.boundaryWest,
        boundary_north: data.boundaryNorth,
        boundary_south: data.boundarySouth,

        // STEP 6
        approach_road_condition: data.approachRoadCondition,
        area_sqft: data.areaSqFt,
        area_basis: data.areaBasis ? data.areaBasis : null,
        rate_basis: data.rateBasis ? data.rateBasis : null,
        rate_per_sqft: data.ratePerSqFt,
        rent_per_month: data.rentPerMonth ? data.rentPerMonth : null,
        negative_points: data.negativePoints ? data.negativePoints : null,
        agent_opinion: data.agentOpinion ? data.agentOpinion : null,

        // STEP 7
        final_remarks: data.finalRemarks ? data.finalRemarks : null,

        // Checker-specific attribution — never touches updated_by_id (Maker's).
        updated_at: now,
        checker_updated_by_id: checker.id,
      })
      .where(eq(fieldVisits.case_id, caseId))
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Failed to retrieve updated field visit");

    await getDb().update(cases).set({ updated_at: now }).where(eq(cases.id, caseId));

    return mapFieldVisitRow(row);
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error("Failed to update field visit by checker:", error);
    throw new Error("Failed to update field visit in database");
  }
}

/**
 * Hand the case forward from the Maker to the Checker for review.
 *
 * This is the Maker's "Submit to Checker" action — the workflow advance that
 * moves the case out of the Maker's editable window and into the Checker's
 * review queue. Authorization reuses requireMakerCase, so it is only permitted
 * for the assigned Maker while the case is at MAKER_ASSIGNED/MAKER_PENDING; a
 * submitted field visit must exist before the case can move on. The stage is
 * advanced to CHECKER_PENDING via a guarded conditional UPDATE so a stale/racey
 * request cannot push a case that has already moved past the Maker.
 */
export async function api_submitToChecker(
  token: string | null | undefined,
  caseId: string,
): Promise<ValuationCase> {
  await requireMakerCase(token, caseId);

  // A field visit must be submitted before the Maker can pass the case on.
  const visitRows = await getDb()
    .select()
    .from(fieldVisits)
    .where(eq(fieldVisits.case_id, caseId))
    .limit(1);
  const visit = visitRows[0];
  if (!visit || visit.status !== "SUBMITTED") {
    throw new Error("A submitted field visit is required before submitting to the checker");
  }

  try {
    const now = new Date();

    // Only advance from a Maker-editable stage. The WHERE clause encodes the
    // guard so a case that already moved on is never dragged back.
    const rows = await getDb()
      .update(cases)
      .set({ stage: "CHECKER_PENDING", updated_at: now })
      .where(and(eq(cases.id, caseId), inArray(cases.stage, [...MAKER_EDITABLE_STAGES])))
      .returning();

    const row = rows[0];
    if (row) {
      return mapCaseRow(row);
    }

    // No row matched: the case moved past the Maker stage between the guard
    // and the update. Re-read to return a precise, non-leaky error.
    const existing = await getDb().select().from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!existing[0]) {
      throw new Error("Case not found");
    }
    throw new Error("This case is no longer awaiting Maker submission");
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error("Failed to submit case to checker:", error);
    throw new Error("Failed to submit case to checker in database");
  }
}

/**
 * Hand the case forward from the Checker to the Uploader for the final upload.
 *
 * The Checker's "Submit to Uploader" action: it advances a case that is under
 * Checker review (CHECKER_PENDING) to UPLOADER_PENDING, dropping it into the
 * Uploader's queue. Enforced from the verified Neon Auth role — CHECKER (plus
 * admins so their access keeps working). The transition is a guarded
 * conditional UPDATE so a case that already moved on cannot be dragged back.
 */
export async function api_submitToUploader(
  token: string | null | undefined,
  caseId: string,
): Promise<ValuationCase> {
  const actor = await requireServerUser(token, "CHECKER", "ADMIN", "SUPER_ADMIN");

  try {
    const now = new Date();

    // Record who checked the case (the verified actor) alongside the stage
    // advance, so the case detail can show "Checked By". Trusted id comes from
    // the verified session, never a client-supplied field.
    const rows = await getDb()
      .update(cases)
      .set({ stage: "UPLOADER_PENDING", checked_by_id: actor.id, updated_at: now })
      .where(and(eq(cases.id, caseId), eq(cases.stage, "CHECKER_PENDING")))
      .returning();

    const row = rows[0];
    if (row) {
      return mapCaseRow(row);
    }

    const existing = await getDb().select().from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!existing[0]) {
      throw new Error("Case not found");
    }
    throw new Error("This case is not awaiting Checker review");
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error("Failed to submit case to uploader:", error);
    throw new Error("Failed to submit case to uploader in database");
  }
}

/**
 * List the cases in the Uploader's queue: everything awaiting the final upload
 * (UPLOADER_PENDING). Not filtered by user id — all Uploaders see the same
 * eligible cases (mirrors the Checker queue). Admins are allowed too so their
 * access keeps working.
 */
export async function api_listUploaderCases(
  token: string | null | undefined,
): Promise<ValuationCase[]> {
  await requireServerUser(token, "UPLOADER", "ADMIN", "SUPER_ADMIN");

  try {
    const rows = await getDb()
      .select()
      .from(cases)
      .where(eq(cases.stage, "UPLOADER_PENDING"))
      .orderBy(cases.created_at);

    return rows.map(mapCaseRow);
  } catch (error) {
    console.error("Failed to list uploader cases:", error);
    throw new Error("Failed to load uploader cases from database");
  }
}

/**
 * List the cases that make up the Uploader's dashboard workload: everything
 * awaiting the final upload (UPLOADER_PENDING) plus everything already closed
 * (COMPLETED). Unlike the Maker there is no per-user uploader assignment — the
 * queue is shared — so "the uploader's cases" are simply the ones at or past
 * the upload step. This backs the uploader's personal Pending/Completed
 * dashboard split. Only UPLOADER (plus admins) sessions permitted.
 */
export async function api_listUploaderDashboardCases(
  token: string | null | undefined,
): Promise<ValuationCase[]> {
  await requireServerUser(token, "UPLOADER", "ADMIN", "SUPER_ADMIN");

  try {
    const rows = await getDb()
      .select()
      .from(cases)
      .where(inArray(cases.stage, ["UPLOADER_PENDING", "COMPLETED"]))
      .orderBy(cases.created_at);

    return rows.map(mapCaseRow);
  } catch (error) {
    console.error("Failed to list uploader dashboard cases:", error);
    throw new Error("Failed to load uploader dashboard cases from database");
  }
}

/**
 * Close the case: the Uploader's "Mark Upload Completed" action. Advances a
 * case awaiting upload (UPLOADER_PENDING) to COMPLETED, the terminal stage.
 * Enforced from the verified Neon Auth role — UPLOADER (plus admins). Guarded
 * conditional UPDATE so only a case genuinely awaiting upload can be closed.
 */
export async function api_markUploadCompleted(
  token: string | null | undefined,
  caseId: string,
): Promise<ValuationCase> {
  const actor = await requireServerUser(token, "UPLOADER", "ADMIN", "SUPER_ADMIN");

  try {
    const now = new Date();

    // Record who performed the final upload (the verified actor) alongside the
    // close, so the case detail can show "Uploaded By". Trusted id comes from
    // the verified session, never a client-supplied field.
    const rows = await getDb()
      .update(cases)
      .set({ stage: "COMPLETED", uploaded_by_id: actor.id, updated_at: now })
      .where(and(eq(cases.id, caseId), eq(cases.stage, "UPLOADER_PENDING")))
      .returning();

    const row = rows[0];
    if (row) {
      return mapCaseRow(row);
    }

    const existing = await getDb().select().from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!existing[0]) {
      throw new Error("Case not found");
    }
    throw new Error("This case is not awaiting upload");
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error("Failed to mark upload completed:", error);
    throw new Error("Failed to mark upload completed in database");
  }
}

/**
 * Result of an on-demand Field Visit PDF generation.
 * `base64` is the PDF bytes base64-encoded for JSON transport back to the
 * client (the existing createServerFn layer is JSON-only). Nothing is stored.
 */
export interface FieldVisitPdfResult {
  filename: string;
  base64: string;
}

/**
 * Generate a Field Visit PDF on demand from the LATEST saved data in Neon.
 *
 * This performs a fresh read every call (field visit + case + customer + bank),
 * so a re-download after any edit reflects the current values. It does not
 * store the PDF, snapshot the visit, or write anything. Authorization mirrors
 * api_getCaseFieldVisit: no token/role check here — the case-detail and
 * field-visit routes guard access, and this is exposed for every role allowed
 * to view a submitted Field Visit.
 *
 * Throws when the case has no Field Visit or the visit is not yet SUBMITTED,
 * so the PDF is only ever produced for a submitted visit.
 */
export async function api_getFieldVisitPdf(caseId: string): Promise<FieldVisitPdfResult> {
  try {
    // Latest Field Visit for the case (case_id is UNIQUE).
    const visitRows = await getDb()
      .select()
      .from(fieldVisits)
      .where(eq(fieldVisits.case_id, caseId))
      .limit(1);
    const visitRow = visitRows[0];
    if (!visitRow) {
      throw new Error("No field visit exists for this case");
    }
    const visit = mapFieldVisitRow(visitRow);
    if (visit.status !== "SUBMITTED") {
      throw new Error("Field visit has not been submitted yet");
    }

    // Case-derived header values, read fresh alongside the visit.
    const caseRows = await getDb().select().from(cases).where(eq(cases.id, caseId)).limit(1);
    const caseRow = caseRows[0];
    if (!caseRow) {
      throw new Error("Case not found");
    }

    const [customerRows, bankRows] = await Promise.all([
      getDb().select().from(customers).where(eq(customers.id, caseRow.customer_id)).limit(1),
      getDb().select().from(banks).where(eq(banks.id, caseRow.bank_id)).limit(1),
    ]);
    const customerRow = customerRows[0];
    const bankRow = bankRows[0];

    // Look up the engineer who submitted the visit for audit purposes.
    const engineer = await api_getUser(visit.engineerId);
    const engineerName = engineer?.name ?? "Unknown";

    const bytes = await buildFieldVisitPdf(visit, {
      caseNumber: caseRow.case_number,
      requestNumber: caseRow.request_number,
      bankName: bankRow?.name ?? "",
      customerName: customerRow?.name ?? "",
      address: customerRow?.address ?? "",
      engineerName,
    });

    // Base64-encode for JSON transport (createServerFn is JSON-only).
    const base64 = Buffer.from(bytes).toString("base64");

    // Filesystem-safe filename derived from the case number.
    const safeCaseNumber = (caseRow.case_number || "field-visit").replace(/[^\w.-]+/g, "_");
    return { filename: `field-visit-${safeCaseNumber}.pdf`, base64 };
  } catch (error) {
    console.error("Failed to generate field visit PDF:", error);
    // Preserve the specific "not submitted / not found" messages for the UI.
    if (
      error instanceof Error &&
      (error.message.includes("field visit") ||
        error.message.includes("Field visit") ||
        error.message.includes("Case not found"))
    ) {
      throw error;
    }
    throw new Error("Failed to generate field visit PDF");
  }
}
