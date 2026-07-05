
-- ============================================
-- MTAA Health OS v5: Role Selection SQL Additions
-- Add these AFTER running the v4.1 SQL
-- ============================================

-- =====================================================
-- RPC: health_get_all_user_roles
-- Returns ALL active staff records for a user
-- (not just the most recent one)
-- =====================================================
DROP FUNCTION IF EXISTS health_get_all_user_roles(UUID);

CREATE OR REPLACE FUNCTION health_get_all_user_roles(p_user_id UUID)
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
  facility_name TEXT,
  facility_type TEXT,
  facility_county TEXT
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
    hf.name AS facility_name,
    hf.type AS facility_type,
    hf.county AS facility_county
  FROM health_staff hs
  LEFT JOIN health_facilities hf ON hs.facility_id = hf.id
  WHERE hs.user_id = p_user_id
    AND hs.status = 'active'
  ORDER BY hs.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION health_get_all_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION health_get_all_user_roles(UUID) TO anon;
