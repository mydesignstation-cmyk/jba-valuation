-- STEP 3: Remove rent_amount (move to STEP 6)
ALTER TABLE field_visits DROP COLUMN IF EXISTS rent_amount;

-- STEP 5: Remove boundary auto-calc columns
ALTER TABLE field_visits DROP COLUMN IF EXISTS boundary_length;
ALTER TABLE field_visits DROP COLUMN IF EXISTS boundary_breadth;
ALTER TABLE field_visits DROP COLUMN IF EXISTS boundary_area;
ALTER TABLE field_visits DROP COLUMN IF EXISTS boundary_description;

-- STEP 6: Update assessment columns
-- Remove rate_basis column
ALTER TABLE field_visits DROP COLUMN IF EXISTS rate_basis;

-- Update rate_per_sqft to handle text values
ALTER TABLE field_visits ALTER COLUMN rate_per_sqft TYPE text;

-- Add rent_per_month column
ALTER TABLE field_visits ADD COLUMN IF NOT EXISTS rent_per_month text;


