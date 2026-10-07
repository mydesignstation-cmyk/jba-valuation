import { getDb } from "@/db";
import { sql } from "drizzle-orm";

async function applyMigration() {
  const db = getDb();
  try {
    // Create maker_valuations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "maker_valuations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "case_id" uuid NOT NULL UNIQUE,
        "date_of_valuation" date NOT NULL,
        "date_of_inspection" date NOT NULL,
        "ref_no" varchar(255) NOT NULL,
        "branch" varchar(255) NOT NULL,
        "bank_name" varchar(255) NOT NULL,
        "pdf_bytes" text NOT NULL,
        "created_by_id" uuid NOT NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "maker_valuations_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE restrict
      );
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "maker_valuations_case_id_idx" ON "maker_valuations"("case_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "maker_valuations_created_by_id_idx" ON "maker_valuations"("created_by_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "maker_valuations_created_at_idx" ON "maker_valuations"("created_at")`);

    console.log("✓ Migration applied successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
