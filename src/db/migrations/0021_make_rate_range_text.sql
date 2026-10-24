ALTER TABLE "maker_valuations"
  ALTER COLUMN "rate_range" TYPE text
  USING "rate_range"::text;
