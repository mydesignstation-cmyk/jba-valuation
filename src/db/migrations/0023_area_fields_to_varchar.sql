-- Change area calculation fields from numeric to varchar to support alphanumeric input
ALTER TABLE "maker_valuations"
  ALTER COLUMN "physical_measured_area" TYPE varchar(255) USING "physical_measured_area"::text,
  ALTER COLUMN "documented_area" TYPE varchar(255) USING "documented_area"::text,
  ALTER COLUMN "approved_plan_area" TYPE varchar(255) USING "approved_plan_area"::text,
  ALTER COLUMN "built_up_area" TYPE varchar(255) USING "built_up_area"::text,
  ALTER COLUMN "adopted_area" TYPE varchar(255) USING "adopted_area"::text,
  ALTER COLUMN "floor_space_index" TYPE varchar(255) USING "floor_space_index"::text;
