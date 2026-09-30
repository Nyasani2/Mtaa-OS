
-- ==========================================
-- FIX HEALTH DATABASE RLS POLICIES
-- ==========================================

-- 1. Add missing columns to health_staff (already exist, but just in case)
ALTER TABLE public.health_staff 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS specialty text;

-- 2. Add missing columns to health_emergency_cases  
ALTER TABLE public.health_emergency_cases
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS location text;

-- 3. Ensure staff_id exists in appointments
ALTER TABLE public.health_appointments 
ADD COLUMN IF NOT EXISTS staff_id uuid;

-- 4. Create health_facilities if not exists (with correct columns)
CREATE TABLE IF NOT EXISTS public.health_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  ownership text DEFAULT 'private',
  phone text,
  email text,
  address text,
  city text,
  country text DEFAULT 'Kenya',
  bed_capacity integer DEFAULT 0,
  license_number text,
  specialties text[],
  admin_user_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Enable RLS on ALL health tables
ALTER TABLE public.health_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_emergency_cases ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for health_facilities
DROP POLICY IF EXISTS "Allow public read access to facilities" ON public.health_facilities;
DROP POLICY IF EXISTS "Allow public read access to facilities" ON public;
CREATE POLICY "Allow public read access to facilities"
ON public.health_facilities FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert facilities" ON public.health_facilities;
DROP POLICY IF EXISTS "Allow authenticated insert facilities" ON public;
CREATE POLICY "Allow authenticated insert facilities"
ON public.health_facilities FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow facility admin update" ON public.health_facilities;
DROP POLICY IF EXISTS "Allow facility admin update" ON public;
CREATE POLICY "Allow facility admin update"
ON public.health_facilities FOR UPDATE
TO authenticated
USING (admin_user_id = auth.uid());

-- 7. RLS Policies for health_staff
DROP POLICY IF EXISTS "Allow public read staff" ON public.health_staff;
DROP POLICY IF EXISTS "Allow public read staff" ON public;
CREATE POLICY "Allow public read staff"
ON public.health_staff FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow staff self update" ON public.health_staff;
DROP POLICY IF EXISTS "Allow staff self update" ON public;
CREATE POLICY "Allow staff self update"
ON public.health_staff FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 8. RLS Policies for health_appointments
DROP POLICY IF EXISTS "Allow patients to view own appointments" ON public.health_appointments;
DROP POLICY IF EXISTS "Allow patients to view own appointments" ON public;
CREATE POLICY "Allow patients to view own appointments"
ON public.health_appointments FOR SELECT
TO authenticated
USING (patient_id = auth.uid() OR staff_id IN (
  SELECT id FROM health_staff WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Allow patients to book appointments" ON public.health_appointments;
DROP POLICY IF EXISTS "Allow patients to book appointments" ON public;
CREATE POLICY "Allow patients to book appointments"
ON public.health_appointments FOR INSERT
TO authenticated
WITH CHECK (patient_id = auth.uid());

-- 9. RLS Policies for health_emergency_cases
DROP POLICY IF EXISTS "Allow emergency read" ON public.health_emergency_cases;
DROP POLICY IF EXISTS "Allow emergency read" ON public;
CREATE POLICY "Allow emergency read"
ON public.health_emergency_cases FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow emergency insert" ON public.health_emergency_cases;
DROP POLICY IF EXISTS "Allow emergency insert" ON public;
CREATE POLICY "Allow emergency insert"
ON public.health_emergency_cases FOR INSERT
TO authenticated
WITH CHECK (true);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_appointments_patient ON health_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_appointments_staff ON health_appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_health_staff_user ON health_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_health_facilities_country ON health_facilities(country);
