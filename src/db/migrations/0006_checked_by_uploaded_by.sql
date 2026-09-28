ALTER TABLE "cases" ADD COLUMN "checked_by_id" uuid;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "uploaded_by_id" uuid;--> statement-breakpoint
CREATE INDEX "cases_checked_by_id_idx" ON "cases" USING btree ("checked_by_id");--> statement-breakpoint
CREATE INDEX "cases_uploaded_by_id_idx" ON "cases" USING btree ("uploaded_by_id");