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
    alternative_contact_person_name: text("alternative_contact_person_name"),
    alternative_phone_number: varchar("alternative_phone_number", { length: 255 }),
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
    // Neon Auth user UUID of the Maker a Checker assigns once the field visit
    // is submitted. NULL until assignment. Like assigned_engineer_id, users
    // live in the neon_auth schema, so this is a plain uuid with no app FK.
    assigned_maker_id: uuid("assigned_maker_id"),
    // Neon Auth user UUID of the Checker who assigned the Maker. NULL until a
    // Maker is assigned. Plain uuid (no app FK) since users live in neon_auth.
    assigned_by_checker_id: uuid("assigned_by_checker_id"),
    // Neon Auth user UUID of the Checker (or admin) who submitted the case to
    // the Uploader. NULL until that hand-off happens. Plain uuid (no app FK)
    // since users live in the neon_auth schema.
    checked_by_id: uuid("checked_by_id"),
    // Neon Auth user UUID of the Uploader (or admin) who marked the upload
    // completed and closed the case. NULL until completion. Plain uuid (no app
    // FK) since users live in the neon_auth schema.
    uploaded_by_id: uuid("uploaded_by_id"),
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
    index("cases_assigned_maker_id_idx").on(table.assigned_maker_id),
    index("cases_assigned_by_checker_id_idx").on(table.assigned_by_checker_id),
    index("cases_checked_by_id_idx").on(table.checked_by_id),
    index("cases_uploaded_by_id_idx").on(table.uploaded_by_id),
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
    other_relationship: varchar("other_relationship", { length: 255 }), // When relationship is "Other"
    other_relationship_remarks: text("other_relationship_remarks"), // Remarks for any relationship type

    // STEP 2 — Property details
    full_address: text("full_address"), // Full Address as per site
    landmark: text("landmark"),
    property_type: varchar("property_type", { length: 50 }),
    property_type_remarks: text("property_type_remarks"), // Remarks if "Other"
    locality_type: varchar("locality_type", { length: 50 }),
    occupancy_status: varchar("occupancy_status", { length: 50 }),
    occupancy_status_remarks: text("occupancy_status_remarks"), // Remarks if "Other"
    occupancy_with_name: text("occupancy_with_name"), // Name of occupant
    year_of_living: varchar("year_of_living", { length: 100 }), // Year of living — STEP 2

    // STEP 3 — Building information
    structure_type: varchar("structure_type", { length: 50 }),
    structure_type_remarks: text("structure_type_remarks"), // Remarks if "Other"
    occupancy_level: varchar("occupancy_level", { length: 100 }), // Changed to allow open text
    floors_in_building: varchar("floors_in_building", { length: 100 }),
    located_on_floor: varchar("located_on_floor", { length: 100 }),
    flats_on_floor: varchar("flats_on_floor", { length: 100 }),
    wings_in_building: varchar("wings_in_building", { length: 100 }),
    lifts_staircases: varchar("lifts_staircases", { length: 100 }),

    // STEP 4 — Construction details
    year_of_construction: integer("year_of_construction"),
    construction_stage: varchar("construction_stage", { length: 100 }), // Changed to open text
    work_description: text("work_description"),
    flat_identification: text("flat_identification"),
    plot_demarcation: text("plot_demarcation"),
    no_of_labor: varchar("no_of_labor", { length: 100 }),
    material_at_site: text("material_at_site"),

    // STEP 5 — Property boundaries
    boundary_east: text("boundary_east"),
    boundary_west: text("boundary_west"),
    boundary_north: text("boundary_north"),
    boundary_south: text("boundary_south"),

    // STEP 6 — Assessment details
    approach_road_condition: varchar("approach_road_condition", { length: 50 }),
    width_of_approach_road: text("width_of_approach_road"),
    remarks_approach_road: text("remarks_approach_road"),
    society_name_board: text("society_name_board"),
    area_sqft: numeric("area_sqft", { precision: 12, scale: 2 }),
    area_basis: varchar("area_basis", { length: 50 }), // Area basis (CA, RERA CA, BUA, SBUA)
    rate_basis: varchar("rate_basis", { length: 50 }), // Rate basis (moved here in current form)
    rate_per_sqft: text("rate_per_sqft"), // Rate per sq.ft. (accepts numbers and text)
    rent_per_month: text("rent_per_month"), // Rent per month
    negative_points: text("negative_points"),
    agent_opinion: text("agent_opinion"),

    // STEP 7 — Final remarks
    final_remarks: text("final_remarks"),

    status: varchar("status", { length: 50 }).notNull().default("DRAFT"),

    // Edit attribution: who last edited this visit and when. `engineer_id`
    // (original submitter), `created_at`, and `submitted_at` remain the
    // immutable original-creation record. `updated_by_id` is the Neon Auth
    // UUID of the Maker who last edited; `checker_updated_by_id` is the Neon
    // Auth UUID of the Checker who last edited. Both are nullable so rows that
    // were never edited carry no updater. They are independent columns so both
    // attributions are preserved. The timestamp is the existing `updated_at`,
    // bumped on every write (maker or checker).
    updated_by_id: uuid("updated_by_id"),
    checker_updated_by_id: uuid("checker_updated_by_id"),

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

// Maker Valuations table
//
// One Maker Valuation per Case (case_id is UNIQUE). Stores the 5 Basic Details
// fields and the generated PDF as bytes. No DRAFT status, no updates—created
// once at submission, PDF generated and stored immediately.
export const makerValuations = pgTable(
  "maker_valuations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    case_id: uuid("case_id").notNull().unique(),
    // Basic Details
    date_of_valuation: date("date_of_valuation").notNull(),
    date_of_inspection: date("date_of_inspection").notNull(),
    ref_no: varchar("ref_no", { length: 255 }).notNull(),
    branch: varchar("branch", { length: 255 }).notNull(),
    bank_name: varchar("bank_name", { length: 255 }).notNull(),
    // Additional Fields
    purchaser_name: varchar("purchaser_name", { length: 255 }),
    type_of_property: varchar("type_of_property", { length: 255 }),
    flat_no: varchar("flat_no", { length: 255 }),
    located_on_floor: varchar("located_on_floor", { length: 255 }),
    wing: varchar("wing", { length: 255 }),
    building_name: varchar("building_name", { length: 255 }),
    landmark: varchar("landmark", { length: 255 }),
    road_name_area: varchar("road_name_area", { length: 255 }),
    location: varchar("location", { length: 255 }),
    plot_no: varchar("plot_no", { length: 255 }),
    cts_no: varchar("cts_no", { length: 255 }),
    s_no: varchar("s_no", { length: 255 }),
    other: varchar("other", { length: 255 }),
    village: varchar("village", { length: 255 }),
    ward_no: varchar("ward_no", { length: 255 }),
    taluka: varchar("taluka", { length: 255 }),
    block_no: varchar("block_no", { length: 255 }),
    district: varchar("district", { length: 255 }),
    pin_code: varchar("pin_code", { length: 255 }),
    // General Section Fields
    purpose_of_valuation: varchar("purpose_of_valuation", { length: 255 }),
    documents_name_1: varchar("documents_name_1", { length: 255 }),
    documents_details_1: text("documents_details_1"),
    documents_name_2: varchar("documents_name_2", { length: 255 }),
    documents_details_2: text("documents_details_2"),
    documents_name_3: varchar("documents_name_3", { length: 255 }),
    documents_details_3: text("documents_details_3"),
    name_of_owner: varchar("name_of_owner", { length: 255 }),
    address: text("address"),
    configuration_in_short: varchar("configuration_in_short", { length: 255 }),
    configuration_full_description: text("configuration_full_description"),
    locality: varchar("locality", { length: 255 }),
    class_of_locality_1: varchar("class_of_locality_1", { length: 255 }),
    class_of_locality_2: varchar("class_of_locality_2", { length: 255 }),
    class_of_locality_3: varchar("class_of_locality_3", { length: 255 }),
    municipal_corporation: varchar("municipal_corporation", { length: 255 }),
    type_of_land: varchar("type_of_land", { length: 255 }),
    genuineness_or_authenticity: varchar("genuineness_or_authenticity", { length: 255 }),
    any_other_comments: text("any_other_comments"),
    nos_of_floor: varchar("nos_of_floor", { length: 255 }),
    nos_of_staircase: varchar("nos_of_staircase", { length: 255 }),
    nos_of_lifts: varchar("nos_of_lifts", { length: 255 }),
    // Boundaries Section
    boundary_property_north: text("boundary_property_north"),
    boundary_property_south: text("boundary_property_south"),
    boundary_property_east: text("boundary_property_east"),
    boundary_property_west: text("boundary_property_west"),
    boundary_property_measured: varchar("boundary_property_measured", { length: 255 }),
    boundary_site_north: text("boundary_site_north"),
    boundary_site_south: text("boundary_site_south"),
    boundary_site_east: text("boundary_site_east"),
    boundary_site_west: text("boundary_site_west"),
    boundary_site_measured: varchar("boundary_site_measured", { length: 255 }),
    latitude: varchar("latitude", { length: 255 }),
    longitude: varchar("longitude", { length: 255 }),
    occupancy: varchar("occupancy", { length: 255 }),
    // Apartment Section
    year_of_construction: varchar("year_of_construction", { length: 255 }),
    age_of_building: varchar("age_of_building", { length: 255 }),
    residual_life: varchar("residual_life", { length: 255 }),
    type_of_structure: varchar("type_of_structure", { length: 255 }),
    nos_of_unit_per_floor: varchar("nos_of_unit_per_floor", { length: 255 }),
    building_type: varchar("building_type", { length: 255 }),
    appearance: varchar("appearance", { length: 255 }),
    quality_of_construction: varchar("quality_of_construction", { length: 255 }),
    maintenance: varchar("maintenance", { length: 255 }),
    protected_water_supply: varchar("protected_water_supply", { length: 255 }),
    underground_sewerage: varchar("underground_sewerage", { length: 255 }),
    nos_of_parking: varchar("nos_of_parking", { length: 255 }),
    compound_wall: varchar("compound_wall", { length: 255 }),
    open_covered_parking: varchar("open_covered_parking", { length: 255 }),
    pavement_laid_around_building: varchar("pavement_laid_around_building", { length: 255 }),
    // Flat Section
    flooring: varchar("flooring", { length: 255 }),
    doors: varchar("doors", { length: 255 }),
    windows: varchar("windows", { length: 255 }),
    fittings: varchar("fittings", { length: 255 }),
    finishing: varchar("finishing", { length: 255 }),
    assessment_no: varchar("assessment_no", { length: 255 }),
    tax_amount: varchar("tax_amount", { length: 255 }),
    tax_paid_in_name_of: varchar("tax_paid_in_name_of", { length: 255 }),
    electricity_service_connection_no: varchar("electricity_service_connection_no", { length: 255 }),
    meter_card_in_name_of: varchar("meter_card_in_name_of", { length: 255 }),
    meter_card_dated: varchar("meter_card_dated", { length: 255 }),
    undivided_area_of_land: varchar("undivided_area_of_land", { length: 255 }),
    // Marketability Section
    marketability: varchar("marketability", { length: 255 }),
    positive_factors: text("positive_factors"),
    negative_factors: text("negative_factors"),
    // Area Calculation Section
    physical_measured_area: numeric("physical_measured_area", { precision: 12, scale: 2 }),
    physical_measured_area_basis: varchar("physical_measured_area_basis", { length: 255 }),
    documented_area: numeric("documented_area", { precision: 12, scale: 2 }),
    documented_area_basis: varchar("documented_area_basis", { length: 255 }),
    approved_plan_area: numeric("approved_plan_area", { precision: 12, scale: 2 }),
    approved_plan_area_basis: varchar("approved_plan_area_basis", { length: 255 }),
    built_up_area: numeric("built_up_area", { precision: 12, scale: 2 }),
    built_up_area_basis: varchar("built_up_area_basis", { length: 255 }),
    adopted_area: numeric("adopted_area", { precision: 12, scale: 2 }),
    adopted_area_basis: varchar("adopted_area_basis", { length: 255 }),
    floor_space_index: numeric("floor_space_index", { precision: 12, scale: 2 }),
    // Rate Section
    rate_range: varchar("rate_range", { length: 255 }),
    adopted_rate: numeric("adopted_rate", { precision: 12, scale: 2 }),
    building_rate: numeric("building_rate", { precision: 12, scale: 2 }),
    land_rate: numeric("land_rate", { precision: 12, scale: 2 }),
    insurance_value: numeric("insurance_value", { precision: 12, scale: 2 }),
    // Details of Valuation Section
    market_value: numeric("market_value", { precision: 12, scale: 2 }),
    car_parking_value: numeric("car_parking_value", { precision: 12, scale: 2 }),
    fair_market_value: numeric("fair_market_value", { precision: 12, scale: 2 }),
    realizable_value: numeric("realizable_value", { precision: 12, scale: 2 }),
    distress_value: numeric("distress_value", { precision: 12, scale: 2 }),
    govt_ready_reckoner_rate_per_sq_mtr: numeric("govt_ready_reckoner_rate_per_sq_mtr", { precision: 12, scale: 2 }),
    govt_ready_reckoner_rate_per_sq_ft: numeric("govt_ready_reckoner_rate_per_sq_ft", { precision: 12, scale: 2 }),
    govt_value: numeric("govt_value", { precision: 12, scale: 2 }),
    rent_range_per_month: numeric("rent_range_per_month", { precision: 12, scale: 2 }),
    // Remarks Section
    remarks: text("remarks"),
    pdf_bytes: text("pdf_bytes").notNull(), // Base64-encoded PDF
    created_by_id: uuid("created_by_id").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.case_id],
      foreignColumns: [cases.id],
      name: "maker_valuations_case_id_fk",
    }).onDelete("restrict"),
    index("maker_valuations_case_id_idx").on(table.case_id),
    index("maker_valuations_created_by_id_idx").on(table.created_by_id),
    index("maker_valuations_created_at_idx").on(table.created_at),
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
