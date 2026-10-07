CREATE TABLE IF NOT EXISTS "maker_valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"date_of_valuation" date NOT NULL,
	"date_of_inspection" date NOT NULL,
	"ref_no" varchar(255) NOT NULL,
	"branch" varchar(255) NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"pdf_bytes" text NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maker_valuations_case_id_unique" UNIQUE("case_id"),
	CONSTRAINT "maker_valuations_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE restrict
);

--> statement-breakpoint
CREATE INDEX "maker_valuations_case_id_idx" ON "maker_valuations" USING btree ("case_id");

--> statement-breakpoint
CREATE INDEX "maker_valuations_created_by_id_idx" ON "maker_valuations" USING btree ("created_by_id");

--> statement-breakpoint
CREATE INDEX "maker_valuations_created_at_idx" ON "maker_valuations" USING btree ("created_at");
