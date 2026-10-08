ALTER TABLE "cases"
  ADD COLUMN IF NOT EXISTS "held_from_stage" varchar(50),
  ADD COLUMN IF NOT EXISTS "held_by_id" uuid,
  ADD COLUMN IF NOT EXISTS "held_at" timestamp with time zone;
