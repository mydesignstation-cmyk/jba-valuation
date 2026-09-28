import { pgTable, text, timestamp, uuid, varchar, index, foreignKey } from "drizzle-orm/pg-core";
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
    floor: varchar("floor", { length: 255 }).notNull(),
    building: varchar("building", { length: 255 }).notNull(),
    age_of_building: varchar("age_of_building", { length: 255 }).notNull(),
    sq_feet: varchar("sq_feet", { length: 255 }).notNull(),
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
