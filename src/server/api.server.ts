/**
 * Server API routes for database operations.
 * These functions run server-side only and won't be bundled into the client.
 * Using .server.ts convention for TanStack Start.
 */

import { getDb } from "@/db";
import { customers, banks, branches, cases } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { Customer, Bank, Branch, ValuationCase, User } from "@/types";

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

// ============================================================================
// CUSTOMERS
// ============================================================================

export async function api_listCustomers(): Promise<Customer[]> {
  try {
    const rows = await getDb()
      .select()
      .from(customers)
      .orderBy(customers.created_at);

    return rows.map((row) => {
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
    });
  } catch (error) {
    console.error("Failed to list customers:", error);
    throw new Error("Failed to load customers from database");
  }
}

export async function api_getCustomer(id: string): Promise<Customer | undefined> {
  try {
    const rows = await getDb()
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!rows || rows.length === 0) {
      return undefined;
    }

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
    const existing = await getDb()
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

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
    const rows = await getDb()
      .select()
      .from(banks)
      .orderBy(banks.created_at);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to list banks:", error);
    throw new Error("Failed to load banks from database");
  }
}

export async function api_getBank(id: string): Promise<Bank | undefined> {
  try {
    const rows = await getDb()
      .select()
      .from(banks)
      .where(eq(banks.id, id))
      .limit(1);

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
    const existing = await getDb()
      .select()
      .from(banks)
      .where(eq(banks.id, id))
      .limit(1);

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
    const rows = await getDb()
      .select()
      .from(branches)
      .orderBy(branches.created_at);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to list branches:", error);
    throw new Error("Failed to load branches from database");
  }
}

export async function api_getBranch(id: string): Promise<Branch | undefined> {
  try {
    const rows = await getDb()
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

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
    const existing = await getDb()
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

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

export async function api_listCases(): Promise<ValuationCase[]> {
  try {
    const rows = await getDb()
      .select()
      .from(cases)
      .orderBy(cases.created_at);

    return rows.map((row) => ({
      id: row.id,
      caseNumber: row.case_number,
      requestNumber: row.request_number,
      customerId: row.customer_id,
      bankId: row.bank_id,
      branchId: row.branch_id,
      assignedEngineerId: row.assigned_engineer_id || "",
      stage: row.stage as any,
      createdById: row.created_by_id || "",
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to list cases:", error);
    throw new Error("Failed to load cases from database");
  }
}

export async function api_getCase(id: string): Promise<ValuationCase | undefined> {
  try {
    const rows = await getDb()
      .select()
      .from(cases)
      .where(eq(cases.id, id))
      .limit(1);

    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];
    if (!row) return undefined;

    return {
      id: row.id,
      caseNumber: row.case_number,
      requestNumber: row.request_number,
      customerId: row.customer_id,
      bankId: row.bank_id,
      branchId: row.branch_id,
      assignedEngineerId: row.assigned_engineer_id || "",
      stage: row.stage as any,
      createdById: row.created_by_id || "",
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
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
        stage: "ASSIGNED",
        created_by_id: data.createdById,
        created_at: now,
        updated_at: now,
      })
      .returning();

    if (!rows || rows.length === 0) throw new Error("Failed to retrieve created case");
    const row = rows[0];
    if (!row) throw new Error("Failed to retrieve created case");

    return {
      id: row.id,
      caseNumber: row.case_number,
      requestNumber: row.request_number,
      customerId: row.customer_id,
      bankId: row.bank_id,
      branchId: row.branch_id,
      assignedEngineerId: row.assigned_engineer_id || "",
      stage: row.stage as any,
      createdById: row.created_by_id || "",
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
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
    const existing = await getDb()
      .select()
      .from(cases)
      .where(eq(cases.id, id))
      .limit(1);

    if (!existing || existing.length === 0) return undefined;

    const now = new Date();
    const updateData: any = { updated_at: now };

    if (data.requestNumber !== undefined) updateData.request_number = data.requestNumber;
    if (data.customerId !== undefined) updateData.customer_id = data.customerId;
    if (data.bankId !== undefined) updateData.bank_id = data.bankId;
    if (data.branchId !== undefined) updateData.branch_id = data.branchId;
    if (data.assignedEngineerId !== undefined)
      updateData.assigned_engineer_id = data.assignedEngineerId;
    if (data.stage !== undefined) updateData.stage = data.stage;

    const rows = await getDb()
      .update(cases)
      .set(updateData)
      .where(eq(cases.id, id))
      .returning();

    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];
    if (!row) return undefined;

    return {
      id: row.id,
      caseNumber: row.case_number,
      requestNumber: row.request_number,
      customerId: row.customer_id,
      bankId: row.bank_id,
      branchId: row.branch_id,
      assignedEngineerId: row.assigned_engineer_id || "",
      stage: row.stage as any,
      createdById: row.created_by_id || "",
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
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
