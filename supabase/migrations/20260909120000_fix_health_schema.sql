
-- ==========================================
-- FIX 1: Check what health tables actually exist
-- ==========================================
-- Run this first to see your actual table structure:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'health%';

-- ==========================================
-- FIX 2: Create health_facilities if it doesn't exist
-- ==========================================
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
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.health_facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert facilities" ON public.health_facilities;
DROP POLICY IF EXISTS "Allow authenticated read facilities" ON public.health_facilities;

DROP POLICY IF EXISTS "Allow authenticated insert facilities" ON public;
CREATE POLICY "Allow authenticated insert facilities" ON public.health_facilities FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated read facilities" ON public;
CREATE POLICY "Allow authenticated read facilities" ON public.health_facilities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update facilities" ON public;
CREATE POLICY "Allow authenticated update facilities" ON public.health_facilities FOR UPDATE TO authenticated USING (true);

-- ==========================================
-- FIX 3: Fix appointments table relationship
-- ==========================================
-- Add staff_id column if missing
ALTER TABLE public.health_appointments ADD COLUMN IF NOT EXISTS staff_id uuid;

-- The relationship error is because Supabase's schema cache needs a restart
-- OR we can work around it by not using the relationship in queries
-- For now, let's ensure the column exists and has an index
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON public.health_appointments(staff_id);

-- ==========================================
-- FIX 4: Ensure health_staff has all needed columns
-- ==========================================
ALTER TABLE public.health_staff ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.health_staff ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE public.health_staff ADD COLUMN IF NOT EXISTS facility_id uuid;
