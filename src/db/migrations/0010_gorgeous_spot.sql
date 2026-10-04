ALTER TABLE "field_visits" ADD COLUMN "full_address" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "rent_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "boundary_length" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "boundary_breadth" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "boundary_area" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "boundary_description" text;--> statement-breakpoint
ALTER TABLE "field_visits" ADD COLUMN "area_basis" varchar(50);