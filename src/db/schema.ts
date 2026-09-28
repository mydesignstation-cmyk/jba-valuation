import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
  foreignKey,
  numeric,
  date,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Customers table
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    contact: varchar("contact", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    address: text("address").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("customers_email_idx").on(table.email),
    index("customers_created_at_idx").on(table.created_at),
  ],
);

// Banks table
export const banks = pgTable(
  "banks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("banks_created_at_idx").on(table.created_at)],
);

// Branches table
export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("branches_created_at_idx").on(table.created_at)],
);

// Cases table
export const cases = pgTable(
  "cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    case_number: varchar("case_number", { length: 100 }).notNull().unique(),
    request_number: varchar("request_number", { length: 100 }).notNull(),
    customer_id: uuid("customer_id").notNull(),
    bank_id: uuid("bank_id").notNull(),
    branch_id: uuid("branch_id").notNull(),
    assigned_engineer_id: uuid("assigned_engineer_id"),
    stage: varchar("stage", { length: 50 }).notNull().default("CREATED"),
    created_by_id: uuid("created_by_id"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.customer_id],
      foreignColumns: [customers.id],
      name: "cases_customer_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.bank_id],
      foreignColumns: [banks.id],
      name: "cases_bank_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.branch_id],
      foreignColumns: [branches.id],
      name: "cases_branch_id_fk",
    }).onDelete("restrict"),
    // Indexes for Case lookups
    index("cases_case_number_idx").on(table.case_number),
    index("cases_request_number_idx").on(table.request_number),
    index("cases_customer_id_idx").on(table.customer_id),
    index("cases_bank_id_idx").on(table.bank_id),
    index("cases_branch_id_idx").on(table.branch_id),
    index("cases_assigned_engineer_id_idx").on(table.assigned_engineer_id),
    index("cases_stage_idx").on(table.stage),
    index("cases_created_at_idx").on(table.created_at),
  ],
);

// Field Visits table
//
// One Field Visit belongs to one Case. The current workflow expects a single
// Field Visit per Case, so `case_id` is UNIQUE to prevent duplicates at the DB
// level. `engineer_id` is the Neon Auth user UUID of the site engineer who
// owns the visit; like `cases.assigned_engineer_id` it is a plain uuid (users
// live in the `neon_auth` schema and are not referenced by an app FK).
export const fieldVisits = pgTable(
  "field_visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    case_id: uuid("case_id").notNull().unique(),
    engineer_id: uuid("engineer_id").notNull(),
    // --- Original first-version fields (kept for the existing working flow) ---
    floor: varchar("floor", { length: 255 }).notNull(),
    building: varchar("building", { length: 255 }).notNull(),
    age_of_building: varchar("age_of_building", { length: 255 }).notNull(),
    sq_feet: varchar("sq_feet", { length: 255 }).notNull(),

    // --- Expanded Field Visit Report fields ---
    // All new columns are NULLABLE so this migration is safe against any
    // Field Visit rows created by the basic version. Required-ness for NEW
    // submissions is enforced at the application/server layer (Zod), not by
    // NOT NULL constraints (which would break the migration on existing rows).

    // Device-captured (auto). GPS is compulsory for NEW submissions (enforced
    // server-side); stored as high-precision numeric so values round-trip.
    visit_date: date("visit_date"),
    gps_latitude: numeric("gps_latitude", { precision: 10, scale: 7 }),
    gps_longitude: numeric("gps_longitude", { precision: 10, scale: 7 }),

    // STEP 1 — Visit details
    person_met: varchar("person_met", { length: 255 }),
    person_phone: varchar("person_phone", { length: 50 }),
    relationship: varchar("relationship", { length: 50 }),

    // STEP 2 — Property details
    landmark: text("landmark"),
    property_type: varchar("property_type", { length: 50 }),
    locality_type: varchar("locality_type", { length: 50 }),
    occupancy_status: varchar("occupancy_status", { length: 50 }),

    // STEP 3 — Building information
    structure_type: varchar("structure_type", { length: 50 }),
    occupancy_level: numeric("occupancy_level", { precision: 5, scale: 2 }),
    floors_in_building: integer("floors_in_building"),
    located_on_floor: varchar("located_on_floor", { length: 100 }),
    flats_on_floor: integer("flats_on_floor"),
    wings_in_building: integer("wings_in_building"),
    lifts_staircases: integer("lifts_staircases"),

    // STEP 4 — Construction details
    year_of_construction: integer("year_of_construction"),
    construction_stage: numeric("construction_stage", { precision: 5, scale: 2 }),
    work_description: text("work_description"),

    // STEP 5 — Property boundaries
    boundary_east: text("boundary_east"),
    boundary_west: text("boundary_west"),
    boundary_north: text("boundary_north"),
    boundary_south: text("boundary_south"),

    // STEP 6 — Assessment details
    approach_road_condition: varchar("approach_road_condition", { length: 50 }),
    area_sqft: numeric("area_sqft", { precision: 12, scale: 2 }),
    rate_per_sqft: numeric("rate_per_sqft", { precision: 12, scale: 2 }),
    negative_points: text("negative_points"),
    agent_opinion: text("agent_opinion"),

    // STEP 7 — Final remarks
    final_remarks: text("final_remarks"),

    status: varchar("status", { length: 50 }).notNull().default("DRAFT"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    submitted_at: timestamp("submitted_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.case_id],
      foreignColumns: [cases.id],
      name: "field_visits_case_id_fk",
    }).onDelete("restrict"),
    index("field_visits_case_id_idx").on(table.case_id),
    index("field_visits_engineer_id_idx").on(table.engineer_id),
    index("field_visits_status_idx").on(table.status),
    index("field_visits_created_at_idx").on(table.created_at),
  ],
);

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  cases: many(cases),
}));

export const banksRelations = relations(banks, ({ many }) => ({
  cases: many(cases),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  cases: many(cases),
}));

export const casesRelations = relations(cases, ({ one }) => ({
  customer: one(customers, {
    fields: [cases.customer_id],
    references: [customers.id],
  }),
  bank: one(banks, {
    fields: [cases.bank_id],
    references: [banks.id],
  }),
  branch: one(branches, {
    fields: [cases.branch_id],
    references: [branches.id],
  }),
  fieldVisit: one(fieldVisits, {
    fields: [cases.id],
    references: [fieldVisits.case_id],
  }),
}));

export const fieldVisitsRelations = relations(fieldVisits, ({ one }) => ({
  case: one(cases, {
    fields: [fieldVisits.case_id],
    references: [cases.id],
  }),
}));
