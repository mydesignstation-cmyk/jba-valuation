ALTER TABLE "field_visits" ALTER COLUMN "occupancy_level" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "field_visits" ALTER COLUMN "floors_in_building" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "field_visits" ALTER COLUMN "flats_on_floor" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "field_visits" ALTER COLUMN "wings_in_building" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "field_visits" ALTER COLUMN "lifts_staircases" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "field_visits" ALTER COLUMN "construction_stage" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "property_type_remarks" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "occupancy_status_remarks" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "occupancy_with_name" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "structure_type_remarks" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "year_of_living" varchar(100);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "flat_identification" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "plot_demarcation" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "no_of_labor" varchar(100);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "material_at_site" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "width_of_approach_road" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "remarks_approach_road" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "society_name_board" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "rate_basis" varchar(50);