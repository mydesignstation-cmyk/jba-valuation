/**
 * Server API routes for database operations.
 * These functions run server-side only and won't be bundled into the client.
 * Using .server.ts convention for TanStack Start.
 */

import { getDb } from "@/db";
import { customers, banks, branches, cases, fieldVisits } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Customer, Bank, Branch, ValuationCase, User, FieldVisit } from "@/types";
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

// ============================================================================
// CUSTOMERS
// ============================================================================

export async function api_listCustomers(): Promise<Customer[]> {
  try {
    const rows = await getDb().select().from(customers).orderBy(customers.created_at);

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
    const rows = await getDb().select().from(customers).where(eq(customers.id, id)).limit(1);

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
    const rows = await getDb().select().from(banks).where(eq(banks.id, id)).limit(1);

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
    const rows = await getDb().select().from(branches).where(eq(branches.id, id)).limit(1);

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

export async function api_listCases(): Promise<ValuationCase[]> {
  try {
    const rows = await getDb().select().from(cases).orderBy(cases.created_at);

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
    const rows = await getDb().select().from(cases).where(eq(cases.id, id)).limit(1);

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
    const existing = await getDb().select().from(cases).where(eq(cases.id, id)).limit(1);

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

    const rows = await getDb().update(cases).set(updateData).where(eq(cases.id, id)).returning();

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
    console.error("Failed to list my cases:", error);
    throw new Error("Failed to load your cases from database");
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
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
  if (row.submitted_at) visit.submittedAt = row.submitted_at.toISOString();

  // Expanded report fields — only surface those that are populated so a
  // basic-version row (all new columns null) maps back to just the originals.
  if (row.visit_date != null) visit.visitDate = row.visit_date;
  if (row.gps_latitude != null) visit.gpsLatitude = row.gps_latitude;
  if (row.gps_longitude != null) visit.gpsLongitude = row.gps_longitude;

  if (row.person_met != null) visit.personMet = row.person_met;
  if (row.person_phone != null) visit.personPhone = row.person_phone;
  if (row.relationship != null) visit.relationship = row.relationship;

  if (row.landmark != null) visit.landmark = row.landmark;
  if (row.property_type != null) visit.propertyType = row.property_type;
  if (row.locality_type != null) visit.localityType = row.locality_type;
  if (row.occupancy_status != null) visit.occupancyStatus = row.occupancy_status;

  if (row.structure_type != null) visit.structureType = row.structure_type;
  if (row.occupancy_level != null) visit.occupancyLevel = row.occupancy_level;
  if (row.floors_in_building != null) visit.floorsInBuilding = row.floors_in_building;
  if (row.located_on_floor != null) visit.locatedOnFloor = row.located_on_floor;
  if (row.flats_on_floor != null) visit.flatsOnFloor = row.flats_on_floor;
  if (row.wings_in_building != null) visit.wingsInBuilding = row.wings_in_building;
  if (row.lifts_staircases != null) visit.liftsStaircases = row.lifts_staircases;

  if (row.year_of_construction != null) visit.yearOfConstruction = row.year_of_construction;
  if (row.construction_stage != null) visit.constructionStage = row.construction_stage;
  if (row.work_description != null) visit.workDescription = row.work_description;

  if (row.boundary_east != null) visit.boundaryEast = row.boundary_east;
  if (row.boundary_west != null) visit.boundaryWest = row.boundary_west;
  if (row.boundary_north != null) visit.boundaryNorth = row.boundary_north;
  if (row.boundary_south != null) visit.boundarySouth = row.boundary_south;

  if (row.approach_road_condition != null)
    visit.approachRoadCondition = row.approach_road_condition;
  if (row.area_sqft != null) visit.areaSqFt = row.area_sqft;
  if (row.rate_per_sqft != null) visit.ratePerSqFt = row.rate_per_sqft;
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
  const { engineerId } = await requireOwnedCase(token, caseId);

  // Re-validate on the server: the browser is never the only gatekeeper.
  const data = fieldVisitFormSchema.parse(input);

  // Reject a second submission for the same Case (idempotency / no duplicates).
  const existing = await getDb()
    .select()
    .from(fieldVisits)
    .where(eq(fieldVisits.case_id, caseId))
    .limit(1);
  if (existing[0]) {
    throw new Error("A field visit has already been submitted for this case");
  }

  try {
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

    const rows = await getDb()
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

        // STEP 2
        landmark: data.landmark,
        property_type: data.propertyType,
        locality_type: data.localityType,
        occupancy_status: data.occupancyStatus,

        // STEP 3
        structure_type: data.structureType,
        occupancy_level: data.occupancyLevel,
        floors_in_building: Number(data.floorsInBuilding),
        located_on_floor: data.locatedOnFloor,
        flats_on_floor: Number(data.flatsOnFloor),
        wings_in_building: Number(data.wingsInBuilding),
        lifts_staircases: Number(data.liftsStaircases),

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
        rate_per_sqft: data.ratePerSqFt,
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
    await getDb()
      .update(cases)
      .set({ stage: "FIELD_VISIT_SUBMITTED", updated_at: now })
      .where(and(eq(cases.id, caseId), inArray(cases.stage, ["ASSIGNED", "FIELD_VISIT_PENDING"])));

    // Always refresh the case's "last updated" timestamp on submission, even if
    // the stage guard above didn't match (e.g. the case had already advanced).
    // This keeps the case's last-updated time in sync with the field visit.
    await getDb().update(cases).set({ updated_at: now }).where(eq(cases.id, caseId));

    return mapFieldVisitRow(row);
  } catch (error) {
    // A race that slips past the pre-check still hits the UNIQUE constraint.
    if (error instanceof Error && error.message.includes("field_visits_case_id")) {
      throw new Error("A field visit has already been submitted for this case");
    }
    console.error("Failed to submit field visit:", error);
    throw new Error("Failed to submit field visit to database");
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

    const bytes = await buildFieldVisitPdf(visit, {
      caseNumber: caseRow.case_number,
      requestNumber: caseRow.request_number,
      bankName: bankRow?.name ?? "",
      customerName: customerRow?.name ?? "",
      address: customerRow?.address ?? "",
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
