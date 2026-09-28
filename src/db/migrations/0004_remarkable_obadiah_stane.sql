ALTER TABLE "cases" ADD COLUMN "assigned_by_checker_id" uuid;--> statement-breakpoint
CREATE INDEX "cases_assigned_by_checker_id_idx" ON "cases" USING btree ("assigned_by_checker_id");