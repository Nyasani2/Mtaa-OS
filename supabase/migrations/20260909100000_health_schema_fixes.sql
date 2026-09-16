-- Fix missing column in emergency cases
ALTER TABLE public.health_emergency_cases 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Create missing ambulance table (No strict FKs to prevent errors if tables are named differently)
CREATE TABLE IF NOT EXISTS public.health_ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid,
  unit_number text NOT NULL,
  driver_id uuid,
  status text DEFAULT 'available',
  location_lat double precision,
  location_lng double precision,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create missing dispatch table
CREATE TABLE IF NOT EXISTS public.health_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambulance_id uuid,
  patient_name text,
  patient_phone text,
  pickup_address text,
  destination_address text,
  notes text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_dispatches ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Allow all for ambulances" ON public.health_ambulances FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dispatches" ON public.health_dispatches FOR ALL TO authenticated USING (true) WITH CHECK (true);
