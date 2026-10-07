-- Add calculation and valuation fields to maker_valuations table

-- Add Area Calculation fields (if not already present)
ALTER TABLE "maker_valuations" 
ADD COLUMN IF NOT EXISTS "physical_measured_area" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "physical_measured_area_basis" varchar(255),
ADD COLUMN IF NOT EXISTS "documented_area" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "documented_area_basis" varchar(255),
ADD COLUMN IF NOT EXISTS "approved_plan_area" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "approved_plan_area_basis" varchar(255),
ADD COLUMN IF NOT EXISTS "built_up_area" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "built_up_area_basis" varchar(255),
ADD COLUMN IF NOT EXISTS "adopted_area" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "adopted_area_basis" varchar(255),
ADD COLUMN IF NOT EXISTS "floor_space_index" numeric(12, 2);

--> statement-breakpoint

-- Add Rate Section fields
ALTER TABLE "maker_valuations" 
ADD COLUMN IF NOT EXISTS "rate_range" varchar(255),
ADD COLUMN IF NOT EXISTS "adopted_rate" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "building_rate" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "land_rate" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "insurance_value" numeric(12, 2);

--> statement-breakpoint

-- Add Details of Valuation fields
ALTER TABLE "maker_valuations" 
ADD COLUMN IF NOT EXISTS "market_value" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "car_parking_value" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "fair_market_value" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "realizable_value" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "distress_value" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "govt_ready_reckoner_rate_per_sq_mtr" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "govt_ready_reckoner_rate_per_sq_ft" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "govt_value" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "rent_range_per_month" numeric(12, 2);

--> statement-breakpoint

-- Add Remarks field
ALTER TABLE "maker_valuations" 
ADD COLUMN IF NOT EXISTS "remarks" text;

--> statement-breakpoint

-- Add additional fields that were missing
ALTER TABLE "maker_valuations" 
ADD COLUMN IF NOT EXISTS "purchaser_name" varchar(255),
ADD COLUMN IF NOT EXISTS "type_of_property" varchar(255),
ADD COLUMN IF NOT EXISTS "flat_no" varchar(255),
ADD COLUMN IF NOT EXISTS "located_on_floor" varchar(255),
ADD COLUMN IF NOT EXISTS "wing" varchar(255),
ADD COLUMN IF NOT EXISTS "building_name" varchar(255),
ADD COLUMN IF NOT EXISTS "landmark" varchar(255),
ADD COLUMN IF NOT EXISTS "road_name_area" varchar(255),
ADD COLUMN IF NOT EXISTS "location" varchar(255),
ADD COLUMN IF NOT EXISTS "plot_no" varchar(255),
ADD COLUMN IF NOT EXISTS "cts_no" varchar(255),
ADD COLUMN IF NOT EXISTS "s_no" varchar(255),
ADD COLUMN IF NOT EXISTS "other" varchar(255),
ADD COLUMN IF NOT EXISTS "village" varchar(255),
ADD COLUMN IF NOT EXISTS "ward_no" varchar(255),
ADD COLUMN IF NOT EXISTS "taluka" varchar(255),
ADD COLUMN IF NOT EXISTS "block_no" varchar(255),
ADD COLUMN IF NOT EXISTS "district" varchar(255),
ADD COLUMN IF NOT EXISTS "pin_code" varchar(255),
ADD COLUMN IF NOT EXISTS "purpose_of_valuation" varchar(255),
ADD COLUMN IF NOT EXISTS "documents_name_1" varchar(255),
ADD COLUMN IF NOT EXISTS "documents_details_1" text,
ADD COLUMN IF NOT EXISTS "documents_name_2" varchar(255),
ADD COLUMN IF NOT EXISTS "documents_details_2" text,
ADD COLUMN IF NOT EXISTS "documents_name_3" varchar(255),
ADD COLUMN IF NOT EXISTS "documents_details_3" text,
ADD COLUMN IF NOT EXISTS "name_of_owner" varchar(255),
ADD COLUMN IF NOT EXISTS "address" text,
ADD COLUMN IF NOT EXISTS "configuration_in_short" varchar(255),
ADD COLUMN IF NOT EXISTS "configuration_full_description" text,
ADD COLUMN IF NOT EXISTS "locality" varchar(255),
ADD COLUMN IF NOT EXISTS "class_of_locality_1" varchar(255),
ADD COLUMN IF NOT EXISTS "class_of_locality_2" varchar(255),
ADD COLUMN IF NOT EXISTS "class_of_locality_3" varchar(255),
ADD COLUMN IF NOT EXISTS "municipal_corporation" varchar(255),
ADD COLUMN IF NOT EXISTS "type_of_land" varchar(255),
ADD COLUMN IF NOT EXISTS "genuineness_or_authenticity" varchar(255),
ADD COLUMN IF NOT EXISTS "any_other_comments" text,
ADD COLUMN IF NOT EXISTS "nos_of_floor" varchar(255),
ADD COLUMN IF NOT EXISTS "nos_of_staircase" varchar(255),
ADD COLUMN IF NOT EXISTS "nos_of_lifts" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_property_north" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_property_south" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_property_east" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_property_west" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_property_measured" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_site_north" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_site_south" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_site_east" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_site_west" varchar(255),
ADD COLUMN IF NOT EXISTS "boundary_site_measured" varchar(255),
ADD COLUMN IF NOT EXISTS "latitude" varchar(255),
ADD COLUMN IF NOT EXISTS "longitude" varchar(255),
ADD COLUMN IF NOT EXISTS "occupancy" varchar(255),
ADD COLUMN IF NOT EXISTS "year_of_construction" varchar(255),
ADD COLUMN IF NOT EXISTS "age_of_building" varchar(255),
ADD COLUMN IF NOT EXISTS "residual_life" varchar(255),
ADD COLUMN IF NOT EXISTS "type_of_structure" varchar(255),
ADD COLUMN IF NOT EXISTS "nos_of_unit_per_floor" varchar(255),
ADD COLUMN IF NOT EXISTS "building_type" varchar(255),
ADD COLUMN IF NOT EXISTS "appearance" varchar(255),
ADD COLUMN IF NOT EXISTS "quality_of_construction" varchar(255),
ADD COLUMN IF NOT EXISTS "maintenance" varchar(255),
ADD COLUMN IF NOT EXISTS "protected_water_supply" varchar(255),
ADD COLUMN IF NOT EXISTS "underground_sewerage" varchar(255),
ADD COLUMN IF NOT EXISTS "nos_of_parking" varchar(255),
ADD COLUMN IF NOT EXISTS "compound_wall" varchar(255),
ADD COLUMN IF NOT EXISTS "open_covered_parking" varchar(255),
ADD COLUMN IF NOT EXISTS "pavement_laid_around_building" varchar(255),
ADD COLUMN IF NOT EXISTS "flooring" varchar(255),
ADD COLUMN IF NOT EXISTS "doors" varchar(255),
ADD COLUMN IF NOT EXISTS "windows" varchar(255),
ADD COLUMN IF NOT EXISTS "fittings" varchar(255),
ADD COLUMN IF NOT EXISTS "finishing" varchar(255),
ADD COLUMN IF NOT EXISTS "assessment_no" varchar(255),
ADD COLUMN IF NOT EXISTS "tax_amount" varchar(255),
ADD COLUMN IF NOT EXISTS "tax_paid_in_name_of" varchar(255),
ADD COLUMN IF NOT EXISTS "electricity_service_connection_no" varchar(255),
ADD COLUMN IF NOT EXISTS "meter_card_in_name_of" varchar(255),
ADD COLUMN IF NOT EXISTS "meter_card_dated" varchar(255),
ADD COLUMN IF NOT EXISTS "undivided_area_of_land" varchar(255),
ADD COLUMN IF NOT EXISTS "marketability" varchar(255),
ADD COLUMN IF NOT EXISTS "positive_factors" text,
ADD COLUMN IF NOT EXISTS "negative_factors" text;
