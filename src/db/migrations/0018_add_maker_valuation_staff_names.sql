ALTER TABLE "maker_valuations"
  ADD COLUMN IF NOT EXISTS "engineer_name" varchar(255),
  ADD COLUMN IF NOT EXISTS "processing_officer_name" varchar(255);
