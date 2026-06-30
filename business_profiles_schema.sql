-- ============================================
-- BUSINESS PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  description text,
  category text,
  sub_category text,
  phone text,
  email text,
  website text,
  logo_url text,
  cover_url text,
  kra_pin text,
  registration_number text,
  verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text])),
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  products_count integer DEFAULT 0,
  services_count integer DEFAULT 0,
  employees_count integer DEFAULT 0,
  branches_count integer DEFAULT 0,
  revenue_month numeric DEFAULT 0,
  location_lat numeric,
  location_lng numeric,
  address text,
  city text,
  region text,
  country text DEFAULT 'KE',
  business_hours jsonb DEFAULT '{}'::jsonb,
  social_links jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT business_profiles_owner_unique UNIQUE (owner_id)
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_owner ON public.business_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_category ON public.business_profiles(category);
CREATE INDEX IF NOT EXISTS idx_business_profiles_status ON public.business_profiles(status);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS business_profiles_select_own ON public.business_profiles;
CREATE POLICY business_profiles_select_own ON public.business_profiles FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS business_profiles_insert_own ON public.business_profiles;
CREATE POLICY business_profiles_insert_own ON public.business_profiles FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS business_profiles_update_own ON public.business_profiles;
CREATE POLICY business_profiles_update_own ON public.business_profiles FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS business_profiles_admin_all ON public.business_profiles;
CREATE POLICY business_profiles_admin_all ON public.business_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION update_business_profiles_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_profiles_updated_at ON public.business_profiles;
CREATE TRIGGER business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION update_business_profiles_updated_at();
