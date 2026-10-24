ALTER TABLE "maker_valuations"
  ALTER COLUMN "rent_range_per_month" TYPE text
  USING "rent_range_per_month"::text;
