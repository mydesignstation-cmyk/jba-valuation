-- STEP 2: Move year_of_living from STEP 3
-- Already exists in schema, no change needed for column

-- STEP 3: Remove rent_amount (move to STEP 6)
ALTER TABLE field_visits DROP COLUMN rent_amount;

-- STEP 5: Remove boundary auto-calc columns
ALTER TABLE field_visits DROP COLUMN boundary_length;
ALTER TABLE field_visits DROP COLUMN boundary_breadth;
ALTER TABLE field_visits DROP COLUMN boundary_area;
ALTER TABLE field_visits DROP COLUMN boundary_description;

-- STEP 6: Update assessment columns
-- Remove rate_basis column
ALTER TABLE field_visits DROP COLUMN rate_basis;

-- Rename rate_per_sqft to text type and add rent_per_month
-- First, we need to update rate_per_sqft to handle text values
ALTER TABLE field_visits ALTER COLUMN rate_per_sqft TYPE text;

-- Add rent_per_month column
ALTER TABLE field_visits ADD COLUMN rent_per_month text;

-- Update area_basis options (already numeric, just clarifying the values: CA, RERA CA, BUA, SBUA)
-- No schema change needed, just validation at application layer
