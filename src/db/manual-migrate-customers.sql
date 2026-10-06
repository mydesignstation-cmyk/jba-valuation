-- Manual migration for alternative contact fields
-- Run this manually if Drizzle migrate fails

ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternative_contact_person_name text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternative_phone_number varchar(255);
