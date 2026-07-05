-- ============================================
-- MTAA Health OS v4.1: Schema + RPC + RLS Fix
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- =====================================================
-- 0. DROP EXISTING FUNCTIONS FIRST (to avoid 42P13)
-- =====================================================
DROP FUNCTION IF EXISTS health_get_primary_staff_record(UUID);
DROP FUNCTION IF EXISTS health_get_all_staff_for_admin(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS health_get_staff_by_facility(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS health_get_staff_stats(UUID);

-- =====================================================
-- 1. ADD MISSING COLUMNS TO health_staff
-- =====================================================
ALTER TABLE health_staff 
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS license_body TEXT;

-- =====================================================
-- 2. FIX RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Inspectors view all registrations" ON health_facility_registrations;
DROP POLICY IF EXISTS "County officers view county registrations" ON health_facility_registrations;
DROP POLICY IF EXISTS "Users view own staff" ON health_staff;
DROP POLICY IF EXISTS "System admins view all staff" ON health_staff;
DROP POLICY IF EXISTS "Hospital admins view facility staff" ON health_staff;
DROP POLICY IF EXISTS "Staff manage own record" ON health_staff;
DROP POLICY IF EXISTS "System admins manage all staff" ON health_staff;
DROP POLICY IF EXISTS "Hospital admins manage facility staff" ON health_staff;

CREATE POLICY "Users view own staff"
  ON health_staff FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System admins view all staff"
  ON health_staff FOR SELECT USING (
    EXISTS (SELECT 1 FROM health_staff hs WHERE hs.user_id = auth.uid() AND hs.role = 'system_admin' AND hs.status = 'active')
  );

CREATE POLICY "Hospital admins view facility staff"
  ON health_staff FOR SELECT USING (
    EXISTS (SELECT 1 FROM health_staff hs WHERE hs.user_id = auth.uid() AND hs.role = 'hospital_admin' AND hs.status = 'active' AND hs.facility_id = health_staff.facility_id)
  );

CREATE POLICY "Staff manage own record"
  ON health_staff FOR ALL USING (user_id = auth.uid());

CREATE POLICY "System admins manage all staff"
  ON health_staff FOR ALL USING (
    EXISTS (SELECT 1 FROM health_staff hs WHERE hs.user_id = auth.uid() AND hs.role = 'system_admin' AND hs.status = 'active')
  );

CREATE POLICY "Hospital admins manage facility staff"
  ON health_staff FOR ALL USING (
    EXISTS (SELECT 1 FROM health_staff hs WHERE hs.user_id = auth.uid() AND hs.role = 'hospital_admin' AND hs.status = 'active' AND hs.facility_id = health_staff.facility_id)
  );

DROP POLICY IF EXISTS "Founders manage own registrations" ON health_facility_registrations;
DROP POLICY IF EXISTS "Inspectors view all registrations" ON health_facility_registrations;
DROP POLICY IF EXISTS "County officers view county registrations" ON health_facility_registrations;

CREATE POLICY "Founders manage own registrations" ON health_facility_registrations FOR ALL USING (founder_user_id = auth.uid());

CREATE POLICY "Inspectors view all registrations" ON health_facility_registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM health_staff hs WHERE hs.user_id = auth.uid() AND hs.role IN ('government_inspector', 'system_admin') AND hs.status = 'active')
);

CREATE POLICY "County officers view county registrations" ON health_facility_registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM health_staff hs JOIN health_facilities hf ON hs.facility_id = hf.id WHERE hs.user_id = auth.uid() AND hs.role = 'county_health_officer' AND hs.status = 'active' AND health_facility_registrations.county = hf.county)
);

-- =====================================================
-- 3. RPC: health_get_primary_staff_record
-- =====================================================
CREATE OR REPLACE FUNCTION health_get_primary_staff_record(p_user_id UUID)
RETURNS TABLE (id UUID, user_id UUID, facility_id UUID, role TEXT, department TEXT, specialization TEXT, status TEXT, onboarding_status TEXT, is_on_duty BOOLEAN, years_of_experience INTEGER, consultation_fee NUMERIC, license_number TEXT, license_body TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT hs.id, hs.user_id, hs.facility_id, hs.role, hs.department, hs.specialization, hs.status, hs.onboarding_status, hs.is_on_duty, hs.years_of_experience, hs.consultation_fee, hs.license_number, hs.license_body, hs.created_at, hs.updated_at
  FROM health_staff hs WHERE hs.user_id = p_user_id AND hs.status = 'active' ORDER BY hs.created_at DESC LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION health_get_primary_staff_record(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION health_get_primary_staff_record(UUID) TO anon;

-- =====================================================
-- 4. RPC: health_get_all_staff_for_admin
-- =====================================================
CREATE OR REPLACE FUNCTION health_get_all_staff_for_admin(p_status_filter TEXT DEFAULT NULL, p_role_filter TEXT DEFAULT NULL, p_search_query TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, user_id UUID, facility_id UUID, role TEXT, department TEXT, specialization TEXT, status TEXT, onboarding_status TEXT, is_on_duty BOOLEAN, years_of_experience INTEGER, consultation_fee NUMERIC, license_number TEXT, license_body TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, user_email TEXT, user_full_name TEXT, facility_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT hs.id, hs.user_id, hs.facility_id, hs.role, hs.department, hs.specialization, hs.status, hs.onboarding_status, hs.is_on_duty, hs.years_of_experience, hs.consultation_fee, hs.license_number, hs.license_body, hs.created_at, hs.updated_at, COALESCE(up.email, au.email) AS user_email, COALESCE(up.full_name, au.raw_user_meta_data->>'full_name') AS user_full_name, hf.name AS facility_name
  FROM health_staff hs LEFT JOIN user_profiles up ON hs.user_id = up.id LEFT JOIN auth.users au ON hs.user_id = au.id LEFT JOIN health_facilities hf ON hs.facility_id = hf.id
  WHERE (p_status_filter IS NULL OR p_status_filter = 'All' OR hs.status = p_status_filter) AND (p_role_filter IS NULL OR p_role_filter = 'All Roles' OR hs.role = p_role_filter) AND (p_search_query IS NULL OR p_search_query = '' OR au.email ILIKE '%' || p_search_query || '%' OR up.full_name ILIKE '%' || p_search_query || '%' OR hf.name ILIKE '%' || p_search_query || '%')
  ORDER BY hs.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION health_get_all_staff_for_admin(TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 5. RPC: health_get_staff_by_facility
-- =====================================================
CREATE OR REPLACE FUNCTION health_get_staff_by_facility(p_facility_id UUID, p_status_filter TEXT DEFAULT NULL, p_role_filter TEXT DEFAULT NULL, p_search_query TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, user_id UUID, facility_id UUID, role TEXT, department TEXT, specialization TEXT, status TEXT, onboarding_status TEXT, is_on_duty BOOLEAN, years_of_experience INTEGER, consultation_fee NUMERIC, license_number TEXT, license_body TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, user_email TEXT, user_full_name TEXT, facility_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT hs.id, hs.user_id, hs.facility_id, hs.role, hs.department, hs.specialization, hs.status, hs.onboarding_status, hs.is_on_duty, hs.years_of_experience, hs.consultation_fee, hs.license_number, hs.license_body, hs.created_at, hs.updated_at, COALESCE(up.email, au.email) AS user_email, COALESCE(up.full_name, au.raw_user_meta_data->>'full_name') AS user_full_name, hf.name AS facility_name
  FROM health_staff hs LEFT JOIN user_profiles up ON hs.user_id = up.id LEFT JOIN auth.users au ON hs.user_id = au.id LEFT JOIN health_facilities hf ON hs.facility_id = hf.id
  WHERE hs.facility_id = p_facility_id AND (p_status_filter IS NULL OR p_status_filter = 'All' OR hs.status = p_status_filter) AND (p_role_filter IS NULL OR p_role_filter = 'All Roles' OR hs.role = p_role_filter) AND (p_search_query IS NULL OR p_search_query = '' OR au.email ILIKE '%' || p_search_query || '%' OR up.full_name ILIKE '%' || p_search_query || '%')
  ORDER BY hs.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION health_get_staff_by_facility(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 6. RPC: health_get_staff_stats
-- =====================================================
CREATE OR REPLACE FUNCTION health_get_staff_stats(p_facility_id UUID DEFAULT NULL)
RETURNS TABLE (active_count BIGINT, pending_count BIGINT, total_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*) FILTER (WHERE status = 'active') AS active_count, COUNT(*) FILTER (WHERE status = 'pending') AS pending_count, COUNT(*) AS total_count FROM health_staff WHERE (p_facility_id IS NULL OR facility_id = p_facility_id);
END;
$$;
GRANT EXECUTE ON FUNCTION health_get_staff_stats(UUID) TO authenticated;
