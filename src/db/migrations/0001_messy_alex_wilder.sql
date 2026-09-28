CREATE TABLE "field_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"engineer_id" uuid NOT NULL,
	"floor" varchar(255) NOT NULL,
	"building" varchar(255) NOT NULL,
	"age_of_building" varchar(255) NOT NULL,
	"sq_feet" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	CONSTRAINT "field_visits_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_visits_case_id_idx" ON "field_visits" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "field_visits_engineer_id_idx" ON "field_visits" USING btree ("engineer_id");--> statement-breakpoint
CREATE INDEX "field_visits_status_idx" ON "field_visits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "field_visits_created_at_idx" ON "field_visits" USING btree ("created_at");