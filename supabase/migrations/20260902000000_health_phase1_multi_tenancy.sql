-- Health Phase 1: multi-tenancy anchor (idempotent)
CREATE TABLE IF NOT EXISTS public.health_facility_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES public.health_facilities(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'STAFF',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, facility_id)
);
ALTER TABLE public.health_patients ADD COLUMN IF NOT EXISTS facility_id uuid;
ALTER TABLE public.health_appointments ADD COLUMN IF NOT EXISTS facility_id uuid;
