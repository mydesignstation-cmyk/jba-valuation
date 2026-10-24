ALTER TABLE "maker_valuations"
ALTER TABLE "maker_valuations"
  ADD COLUMN IF NOT EXISTS "realizable_value_percent" numeric(5, 2),
  ADD COLUMN IF NOT EXISTS "distress_value_percent" numeric(5, 2);

