-- ============================================================
-- MTAA MTruck Phase 1: Shipper + Heavy Equipment Tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================
-- 1. mtruck_shipper_requests
-- Shipper posts a haul request, carriers bid
-- ============================================
CREATE TABLE IF NOT EXISTS public.mtruck_shipper_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cargo_type text NOT NULL,
    tonnage_category text NOT NULL CHECK (tonnage_category IN ('light', 'medium', 'heavy', 'extra_heavy', 'abnormal')),
    weight_kg numeric NOT NULL CHECK (weight_kg > 0),
    origin_address text NOT NULL,
    origin_lat numeric,
    origin_lng numeric,
    dest_address text NOT NULL,
    dest_lat numeric,
    dest_lng numeric,
    pickup_date timestamptz NOT NULL,
    delivery_deadline timestamptz NOT NULL,
    urgency text NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'express', 'critical')),
    special_requirements text[] DEFAULT '{}',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.mtruck_shipper_requests IS 'Shipper haul requests posted for carrier bidding';

CREATE INDEX IF NOT EXISTS idx_mtruck_requests_shipper ON public.mtruck_shipper_requests(shipper_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_requests_status ON public.mtruck_shipper_requests(status);
CREATE INDEX IF NOT EXISTS idx_mtruck_requests_created ON public.mtruck_shipper_requests(created_at DESC);

-- ============================================
-- 2. mtruck_haul_quotes
-- Carrier quotes on shipper requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.mtruck_haul_quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES public.mtruck_shipper_requests(id) ON DELETE CASCADE,
    fleet_id uuid NOT NULL,
    fleet_name text NOT NULL,
    rate numeric NOT NULL CHECK (rate > 0),
    currency text NOT NULL DEFAULT 'ZAR',
    estimated_hours numeric,
    truck_type text,
    equipment_included text[] DEFAULT '{}',
    insurance_included boolean DEFAULT false,
    expiry_time timestamptz,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.mtruck_haul_quotes IS 'Carrier quotes submitted against shipper requests';

CREATE INDEX IF NOT EXISTS idx_mtruck_quotes_request ON public.mtruck_haul_quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_quotes_fleet ON public.mtruck_haul_quotes(fleet_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_quotes_status ON public.mtruck_haul_quotes(status);

-- ============================================
-- 3. mtruck_jobs
-- Active/completed haul jobs (created when quote accepted)
-- ============================================
CREATE TABLE IF NOT EXISTS public.mtruck_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipper_name text,
    shipper_phone text,
    cargo_type text NOT NULL,
    tonnage_category text NOT NULL,
    weight_kg numeric NOT NULL,
    dimensions jsonb,
    hazardous boolean DEFAULT false,
    fragile boolean DEFAULT false,
    temperature_controlled boolean DEFAULT false,
    origin jsonb NOT NULL,
    destination jsonb NOT NULL,
    distance_km numeric DEFAULT 0,
    pickup_date timestamptz NOT NULL,
    delivery_deadline timestamptz NOT NULL,
    urgency text NOT NULL,
    quoted_rate numeric,
    final_rate numeric,
    currency text DEFAULT 'ZAR',
    assigned_truck_id uuid REFERENCES public.mtruck_trucks(id),
    assigned_driver_id uuid REFERENCES public.mtruck_drivers(id),
    assigned_equipment_ids uuid[] DEFAULT '{}',
    status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('draft', 'quoting', 'quoted', 'accepted', 'assigned', 'pickup', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed')),
    current_location jsonb,
    eta_minutes numeric,
    created_at timestamptz DEFAULT now(),
    quoted_at timestamptz,
    accepted_at timestamptz,
    pickup_at timestamptz,
    delivered_at timestamptz,
    completed_at timestamptz,
    shipper_rating numeric CHECK (shipper_rating >= 0 AND shipper_rating <= 5),
    driver_rating numeric CHECK (driver_rating >= 0 AND driver_rating <= 5),
    shipper_review text,
    driver_review text,
    documents jsonb DEFAULT '[]'
);

COMMENT ON TABLE public.mtruck_jobs IS 'Haul jobs created when shipper accepts a carrier quote';

CREATE INDEX IF NOT EXISTS idx_mtruck_jobs_shipper ON public.mtruck_jobs(shipper_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_jobs_status ON public.mtruck_jobs(status);
CREATE INDEX IF NOT EXISTS idx_mtruck_jobs_truck ON public.mtruck_jobs(assigned_truck_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_jobs_driver ON public.mtruck_jobs(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_jobs_created ON public.mtruck_jobs(created_at DESC);

-- ============================================
-- 4. mtruck_heavy_equipment
-- Heavy equipment catalog (cranes, excavators, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.mtruck_heavy_equipment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('crane', 'excavator', 'bulldozer', 'loader', 'grader', 'roller', 'dump_truck', 'tanker', 'flatbed', 'refrigerated', 'car_carrier', 'tipper', 'lowbed')),
    name text NOT NULL,
    capacity numeric NOT NULL CHECK (capacity > 0),
    dimensions jsonb,
    operator_required boolean DEFAULT false,
    rate_per_day numeric NOT NULL CHECK (rate_per_day >= 0),
    rate_per_hour numeric NOT NULL CHECK (rate_per_hour >= 0),
    location jsonb,
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'maintenance', 'in_use')),
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    images text[] DEFAULT '{}',
    certifications text[] DEFAULT '{}',
    insurance_expiry date,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.mtruck_heavy_equipment IS 'Heavy equipment available for rent/lease';

CREATE INDEX IF NOT EXISTS idx_mtruck_equip_type ON public.mtruck_heavy_equipment(type);
CREATE INDEX IF NOT EXISTS idx_mtruck_equip_status ON public.mtruck_heavy_equipment(status);
CREATE INDEX IF NOT EXISTS idx_mtruck_equip_owner ON public.mtruck_heavy_equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_equip_rate ON public.mtruck_heavy_equipment(rate_per_day ASC);

-- ============================================
-- 5. mtruck_equipment_bookings
-- Bookings for heavy equipment
-- ============================================
CREATE TABLE IF NOT EXISTS public.mtruck_equipment_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id uuid NOT NULL REFERENCES public.mtruck_heavy_equipment(id) ON DELETE CASCADE,
    requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id uuid REFERENCES public.mtruck_jobs(id) ON DELETE SET NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    hours_per_day numeric DEFAULT 8,
    rate_agreed numeric NOT NULL,
    operator_included boolean DEFAULT false,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    delivery_location jsonb,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.mtruck_equipment_bookings IS 'Equipment rental bookings linked to jobs or standalone';

CREATE INDEX IF NOT EXISTS idx_mtruck_bookings_equip ON public.mtruck_equipment_bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_bookings_requester ON public.mtruck_equipment_bookings(requester_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_bookings_job ON public.mtruck_equipment_bookings(job_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_bookings_status ON public.mtruck_equipment_bookings(status);
CREATE INDEX IF NOT EXISTS idx_mtruck_bookings_dates ON public.mtruck_equipment_bookings(start_date, end_date);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.mtruck_shipper_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtruck_haul_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtruck_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtruck_heavy_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtruck_equipment_bookings ENABLE ROW LEVEL SECURITY;

-- mtruck_shipper_requests: shipper sees own, carriers see pending
CREATE POLICY "Shippers can manage own requests" ON public.mtruck_shipper_requests
    FOR ALL USING (auth.uid() = shipper_id);

CREATE POLICY "Carriers can view pending requests" ON public.mtruck_shipper_requests
    FOR SELECT USING (status = 'pending');

-- mtruck_haul_quotes: fleet sees own quotes, shipper sees quotes on their requests
CREATE POLICY "Fleets can manage own quotes" ON public.mtruck_haul_quotes
    FOR ALL USING (auth.uid() = fleet_id);

CREATE POLICY "Shippers can view quotes on their requests" ON public.mtruck_haul_quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mtruck_shipper_requests r
            WHERE r.id = request_id AND r.shipper_id = auth.uid()
        )
    );

-- mtruck_jobs: shipper and assigned driver can view
CREATE POLICY "Shippers can view own jobs" ON public.mtruck_jobs
    FOR ALL USING (auth.uid() = shipper_id);

CREATE POLICY "Drivers can view assigned jobs" ON public.mtruck_jobs
    FOR SELECT USING (auth.uid() = assigned_driver_id);

-- mtruck_heavy_equipment: owners manage, everyone can view available
CREATE POLICY "Owners can manage own equipment" ON public.mtruck_heavy_equipment
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view available equipment" ON public.mtruck_heavy_equipment
    FOR SELECT USING (status = 'available');

-- mtruck_equipment_bookings: requester and owner can view
CREATE POLICY "Requesters can manage own bookings" ON public.mtruck_equipment_bookings
    FOR ALL USING (auth.uid() = requester_id);

CREATE POLICY "Equipment owners can view bookings" ON public.mtruck_equipment_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mtruck_heavy_equipment e
            WHERE e.id = equipment_id AND e.owner_id = auth.uid()
        )
    );

-- ============================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mtruck_requests_updated ON public.mtruck_shipper_requests;
CREATE TRIGGER trg_mtruck_requests_updated
    BEFORE UPDATE ON public.mtruck_shipper_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_mtruck_jobs_updated ON public.mtruck_jobs;
CREATE TRIGGER trg_mtruck_jobs_updated
    BEFORE UPDATE ON public.mtruck_jobs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- VERIFY: List all mtruck tables
-- ============================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'mtruck%'
ORDER BY table_name;
