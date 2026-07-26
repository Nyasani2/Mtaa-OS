-- MTruck Fleet Onboarding Fix
-- Adds compliance, contact, and coverage columns to mtruck_fleet
-- so the onboarding screen can store all collected data.

ALTER TABLE mtruck_fleet
  ADD COLUMN IF NOT EXISTS business_reg TEXT,
  ADD COLUMN IF NOT EXISTS kra_pin TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS truck_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coverage_areas TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
  ADD COLUMN IF NOT EXISTS insurance_number TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Rename fleet_size → vehicle_count for consistency with onboarding
-- (Only if fleet_size exists and vehicle_count doesn't)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mtruck_fleet' AND column_name = 'fleet_size'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mtruck_fleet' AND column_name = 'vehicle_count'
  ) THEN
    ALTER TABLE mtruck_fleet RENAME COLUMN fleet_size TO vehicle_count;
  END IF;
END $$;

-- Add comment for clarity
COMMENT ON TABLE mtruck_fleet IS 'MTruck fleet/company records. One record per trucking company owner.';
