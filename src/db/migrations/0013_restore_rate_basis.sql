-- RESTORE: Add rate_basis column back (was accidentally dropped)
ALTER TABLE field_visits ADD COLUMN rate_basis varchar(255);
