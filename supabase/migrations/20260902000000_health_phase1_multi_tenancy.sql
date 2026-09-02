-- =========================================================
-- MTAA HEALTH OS: PHASE 1 - MULTI-TENANCY & CONSOLIDATION
-- =========================================================

-- 1. CREATE UNIFIED FACILITY STAFF MAPPING (The Multi-Tenancy Anchor)
CREATE TABLE IF NOT EXISTS public.health_facility_staff (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id uuid REFERENCES public.health_facilities(id) ON DELETE CASCADE,
    role text CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH', 'RADIOLOGIST', 'PHARMACIST', 'CASHIER', 'PARAMEDIC')),
    status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, facility_id)
);

-- 2. SECURITY DEFINER HELPER: Check if user belongs to a facility
CREATE OR REPLACE FUNCTION public.user_has_facility_access(target_facility_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.health_facility_staff
    WHERE user_id = auth.uid() AND facility_id = target_facility_id AND status = 'ACTIVE'
  ) OR EXISTS (
    -- Fallback for legacy admin table if it exists
    SELECT 1 FROM public.health_facility_admins
    WHERE user_id = auth.uid() AND facility_id = target_facility_id
  ) OR EXISTS (
    -- Allow patients to see their own facility records
    SELECT 1 FROM public.health_patients
    WHERE user_id = auth.uid() AND primary_facility_id = target_facility_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. APPLY STRICT MULTI-TENANT RLS TO CORE CLINICAL TABLES
-- (We drop existing permissive policies to prevent data leaks)

-- PATIENTS
DROP POLICY IF EXISTS "health_patients_select" ON public.health_patients;
CREATE POLICY "health_patients_multi_tenant" ON public.health_patients
FOR SELECT USING (
    user_id = auth.uid() OR 
    public.user_has_facility_access(primary_facility_id)
);

-- RECORDS / EHR
DROP POLICY IF EXISTS "health_records_select" ON public.health_records;
CREATE POLICY "health_records_multi_tenant" ON public.health_records
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.health_patients WHERE user_id = auth.uid()) OR
    public.user_has_facility_access(facility_id)
);

-- APPOINTMENTS
DROP POLICY IF EXISTS "health_appointments_select" ON public.health_appointments;
CREATE POLICY "health_appointments_multi_tenant" ON public.health_appointments
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.health_patients WHERE user_id = auth.uid()) OR
    public.user_has_facility_access(facility_id)
);

-- 4. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_health_facility_staff_user ON public.health_facility_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_health_facility_staff_facility ON public.health_facility_staff(facility_id);
CREATE INDEX IF NOT EXISTS idx_health_records_facility ON public.health_records(facility_id);

