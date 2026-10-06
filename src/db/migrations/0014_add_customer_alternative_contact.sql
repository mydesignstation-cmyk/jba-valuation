-- Add alternative contact fields to customers table
ALTER TABLE customers ADD COLUMN alternative_contact_person_name text;
ALTER TABLE customers ADD COLUMN alternative_phone_number varchar(255);
