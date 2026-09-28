ALTER TABLE "cases" ADD COLUMN "assigned_maker_id" uuid;--> statement-breakpoint
CREATE INDEX "cases_assigned_maker_id_idx" ON "cases" USING btree ("assigned_maker_id");