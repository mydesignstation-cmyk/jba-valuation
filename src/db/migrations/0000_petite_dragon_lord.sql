CREATE TABLE "banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_number" varchar(100) NOT NULL,
	"request_number" varchar(100) NOT NULL,
	"customer_id" uuid NOT NULL,
	"bank_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"assigned_engineer_id" uuid,
	"stage" varchar(50) DEFAULT 'CREATED' NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact" varchar(255) NOT NULL,
	"email" varchar(255),
	"address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_bank_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "banks_created_at_idx" ON "banks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "branches_created_at_idx" ON "branches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cases_case_number_idx" ON "cases" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "cases_request_number_idx" ON "cases" USING btree ("request_number");--> statement-breakpoint
CREATE INDEX "cases_customer_id_idx" ON "cases" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "cases_bank_id_idx" ON "cases" USING btree ("bank_id");--> statement-breakpoint
CREATE INDEX "cases_branch_id_idx" ON "cases" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "cases_assigned_engineer_id_idx" ON "cases" USING btree ("assigned_engineer_id");--> statement-breakpoint
CREATE INDEX "cases_stage_idx" ON "cases" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "cases_created_at_idx" ON "cases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");