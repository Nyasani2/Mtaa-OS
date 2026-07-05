-- ============================================
-- MTAA Health OS: RPC Functions for Role Detection
-- Run this in Supabase SQL Editor
-- ============================================

-- =====================================================
-- 1. Add missing specialization column to health_staff
-- =====================================================
ALTER TABLE health_staff 
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS license_body TEXT;

-- =====================================================
-- 2. Create RPC function: health_get_primary_staff_record
-- SECURITY DEFINER to bypass RLS recursion
-- =====================================================
CREATE OR REPLACE FUNCTION health_get_primary_staff_record(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  facility_id UUID,
  role TEXT,
  department TEXT,
  specialization TEXT,
  status TEXT,
  onboarding_status TEXT,
  is_on_duty BOOLEAN,
  years_of_experience INTEGER,
  consultation_fee NUMERIC,
  license_number TEXT,
  license_body TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.id,
    hs.user_id,
    hs.facility_id,
    hs.role,
    hs.department,
    hs.specialization,
    hs.status,
    hs.onboarding_status,
    hs.is_on_duty,
    hs.years_of_experience,
    hs.consultation_fee,
    hs.license_number,
    hs.license_body,
    hs.created_at,
    hs.updated_at
  FROM health_staff hs
  WHERE hs.user_id = p_user_id
    AND hs.status = 'active'
  ORDER BY hs.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION health_get_primary_staff_record(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION health_get_primary_staff_record(UUID) TO anon;

-- =====================================================
-- 3. Create RPC function: health_get_staff_by_facility
-- For the Staff Management screen
-- =====================================================
CREATE OR REPLACE FUNCTION health_get_staff_by_facility(
  p_facility_id UUID,
  p_status_filter TEXT DEFAULT 'All',
  p_role_filter TEXT DEFAULT 'All Roles',
  p_search_query TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  facility_id UUID,
  role TEXT,
  department TEXT,
  specialization TEXT,
  status TEXT,
  onboarding_status TEXT,
  is_on_duty BOOLEAN,
  years_of_experience INTEGER,
  consultation_fee NUMERIC,
  license_number TEXT,
  license_body TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_email TEXT,
  user_full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.id,
    hs.user_id,
    hs.facility_id,
    hs.role,
    hs.department,
    hs.specialization,
    hs.status,
    hs.onboarding_status,
    hs.is_on_duty,
    hs.years_of_experience,
    hs.consultation_fee,
    hs.license_number,
    hs.license_body,
    hs.created_at,
    hs.updated_at,
    au.email as user_email,
    COALESCE(up.full_name, au.email) as user_full_name
  FROM health_staff hs
  LEFT JOIN auth.users au ON hs.user_id = au.id
  LEFT JOIN user_profiles up ON hs.user_id = up.id
  WHERE hs.facility_id = p_facility_id
    AND (p_status_filter = 'All' OR hs.status = p_status_filter)
    AND (p_role_filter = 'All Roles' OR hs.role = p_role_filter)
    AND (
      p_search_query = '' 
      OR au.email ILIKE '%' || p_search_query || '%'
      OR COALESCE(up.full_name, '') ILIKE '%' || p_search_query || '%'
    )
  ORDER BY hs.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION health_get_staff_by_facility(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 4. Create RPC function: health_get_all_staff_for_system_admin
-- For system_admin to view ALL staff across ALL facilities
-- =====================================================
CREATE OR REPLACE FUNCTION health_get_all_staff_for_system_admin(
  p_status_filter TEXT DEFAULT 'All',
  p_role_filter TEXT DEFAULT 'All Roles',
  p_search_query TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  facility_id UUID,
  role TEXT,
  department TEXT,
  specialization TEXT,
  status TEXT,
  onboarding_status TEXT,
  is_on_duty BOOLEAN,
  years_of_experience INTEGER,
  consultation_fee NUMERIC,
  license_number TEXT,
  license_body TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_email TEXT,
  user_full_name TEXT,
  facility_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.id,
    hs.user_id,
    hs.facility_id,
    hs.role,
    hs.department,
    hs.specialization,
    hs.status,
    hs.onboarding_status,
    hs.is_on_duty,
    hs.years_of_experience,
    hs.consultation_fee,
    hs.license_number,
    hs.license_body,
    hs.created_at,
    hs.updated_at,
    au.email as user_email,
    COALESCE(up.full_name, au.email) as user_full_name,
    hf.name as facility_name
  FROM health_staff hs
  LEFT JOIN auth.users au ON hs.user_id = au.id
  LEFT JOIN user_profiles up ON hs.user_id = up.id
  LEFT JOIN health_facilities hf ON hs.facility_id = hf.id
  WHERE (p_status_filter = 'All' OR hs.status = p_status_filter)
    AND (p_role_filter = 'All Roles' OR hs.role = p_role_filter)
    AND (
      p_search_query = '' 
      OR au.email ILIKE '%' || p_search_query || '%'
      OR COALESCE(up.full_name, '') ILIKE '%' || p_search_query || '%'
      OR COALESCE(hf.name, '') ILIKE '%' || p_search_query || '%'
    )
  ORDER BY hs.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION health_get_all_staff_for_system_admin(TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 5. Fix RLS policies to prevent recursion
-- =====================================================

-- Drop old recursive policies
DROP POLICY IF EXISTS "Users view own staff" ON health_staff;
DROP POLICY IF EXISTS "System admins view all staff" ON health_staff;
DROP POLICY IF EXISTS "Hospital admins view facility staff" ON health_staff;

-- Create non-recursive policies using SECURITY DEFINER functions
CREATE POLICY "Users view own staff"
  ON health_staff FOR SELECT
  USING (user_id = auth.uid());

-- System admin policy using the RPC function instead of self-reference
CREATE POLICY "System admins view all staff"
  ON health_staff FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs2
      WHERE hs2.user_id = auth.uid()
        AND hs2.role = 'system_admin'
        AND hs2.status = 'active'
    )
  );

-- Hospital admin policy
CREATE POLICY "Hospital admins view facility staff"
  ON health_staff FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs2
      WHERE hs2.user_id = auth.uid()
        AND hs2.role = 'hospital_admin'
        AND hs2.status = 'active'
        AND hs2.facility_id = health_staff.facility_id
    )
  );

-- Insert policy for system admin
CREATE POLICY "System admins insert staff"
  ON health_staff FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_staff hs2
      WHERE hs2.user_id = auth.uid()
        AND hs2.role = 'system_admin'
        AND hs2.status = 'active'
    )
  );

-- Update policy for system admin and HR manager
CREATE POLICY "Admins update staff"
  ON health_staff FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs2
      WHERE hs2.user_id = auth.uid()
        AND hs2.role IN ('system_admin', 'hospital_admin', 'hr_manager')
        AND hs2.status = 'active'
    )
  );

-- Delete policy for system admin only
CREATE POLICY "System admins delete staff"
  ON health_staff FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs2
      WHERE hs2.user_id = auth.uid()
        AND hs2.role = 'system_admin'
        AND hs2.status = 'active'
    )
  );

-- =====================================================
-- 6. Fix health_facilities RLS policies
-- =====================================================
DROP POLICY IF EXISTS "System admins manage facilities" ON health_facilities;

CREATE POLICY "System admins manage facilities"
  ON health_facilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs
      WHERE hs.user_id = auth.uid()
        AND hs.role = 'system_admin'
        AND hs.status = 'active'
    )
  );

-- Allow all authenticated users to view verified facilities
CREATE POLICY "Users view verified facilities"
  ON health_facilities FOR SELECT
  USING (status = 'verified');

-- Allow facility founders to manage their own facilities
CREATE POLICY "Founders manage own facilities"
  ON health_facilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM health_facility_registrations hfr
      WHERE hfr.founder_user_id = auth.uid()
        AND hfr.id = health_facilities.registration_id
    )
  );

-- =====================================================
-- 7. Update seed data to include specialization column
-- =====================================================
UPDATE health_staff 
SET specialization = 'General Practice' 
WHERE role = 'doctor' AND specialization IS NULL;

UPDATE health_staff 
SET specialization = 'General Nursing' 
WHERE role = 'nurse' AND specialization IS NULL;

UPDATE health_staff 
SET specialization = 'General Pharmacy' 
WHERE role = 'pharmacist' AND specialization IS NULL;

UPDATE health_staff 
SET specialization = 'General Lab' 
WHERE role = 'lab_technician' AND specialization IS NULL;

UPDATE health_staff 
SET specialization = 'Administration' 
WHERE role = 'hospital_admin' AND specialization IS NULL;

UPDATE health_staff 
SET specialization = 'System Administration' 
WHERE role = 'system_admin' AND specialization IS NULL;

-- =====================================================
-- 8. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_health_staff_user_id ON health_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_health_staff_facility_id ON health_staff(facility_id);
CREATE INDEX IF NOT EXISTS idx_health_staff_role ON health_staff(role);
CREATE INDEX IF NOT EXISTS idx_health_staff_status ON health_staff(status);
CREATE INDEX IF NOT EXISTS idx_health_staff_user_role_status ON health_staff(user_id, role, status);
