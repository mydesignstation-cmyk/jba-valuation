ALTER TABLE "field_visits" ADD COLUMN "visit_date" date;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "gps_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "gps_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "person_met" varchar(255);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "person_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "relationship" varchar(50);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "landmark" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "property_type" varchar(50);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "locality_type" varchar(50);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "occupancy_status" varchar(50);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "structure_type" varchar(50);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "occupancy_level" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "floors_in_building" integer;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "located_on_floor" varchar(100);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "flats_on_floor" integer;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "wings_in_building" integer;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "lifts_staircases" integer;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "year_of_construction" integer;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "construction_stage" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "work_description" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "boundary_east" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "boundary_west" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "boundary_north" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "boundary_south" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "approach_road_condition" varchar(50);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "area_sqft" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "rate_per_sqft" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "negative_points" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "agent_opinion" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "final_remarks" text;