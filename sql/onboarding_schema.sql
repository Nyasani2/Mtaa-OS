-- MTAA Onboarding Schema — MTruck, Boda, Restaurant, Jobs, Agent
-- Run in Supabase Dashboard → SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. MTRUCK COMPANIES
-- ============================================================
CREATE TABLE IF NOT EXISTS mtruck_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_reg TEXT NOT NULL,
  kra_pin TEXT NOT NULL,
  address TEXT,
  city TEXT,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  fleet_size INTEGER DEFAULT 0,
  truck_types TEXT[] DEFAULT '{}',
  coverage_areas TEXT[] DEFAULT '{}',
  license_number TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  status TEXT DEFAULT 'pending_verification',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mtruck_companies_owner ON mtruck_companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_mtruck_companies_status ON mtruck_companies(status);

ALTER TABLE mtruck_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mtruck_companies_select_own ON mtruck_companies;
DROP POLICY IF EXISTS mtruck_companies_insert_own ON mtruck_companies;
DROP POLICY IF EXISTS mtruck_companies_update_own ON mtruck_companies;

CREATE POLICY mtruck_companies_select_own ON mtruck_companies FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY mtruck_companies_insert_own ON mtruck_companies FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY mtruck_companies_update_own ON mtruck_companies FOR UPDATE USING (owner_id = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE mtruck_companies; EXCEPTION WHEN duplicate_object THEN END $$;

-- ============================================================
-- 2. BODA RIDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS boda_riders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL,
  operating_area TEXT,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT,
  plate_number TEXT NOT NULL,
  engine_cc INTEGER DEFAULT 0,
  year_of_manufacture INTEGER,
  has_helmet BOOLEAN DEFAULT FALSE,
  has_reflective_jacket BOOLEAN DEFAULT FALSE,
  driving_license TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  sacco_name TEXT,
  status TEXT DEFAULT 'pending_verification',
  is_online BOOLEAN DEFAULT FALSE,
  total_rides INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  earnings_today NUMERIC(12,2) DEFAULT 0,
  earnings_week NUMERIC(12,2) DEFAULT 0,
  earnings_month NUMERIC(12,2) DEFAULT 0,
  current_location JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boda_riders_user ON boda_riders(user_id);
CREATE INDEX IF NOT EXISTS idx_boda_riders_status ON boda_riders(status);
CREATE INDEX IF NOT EXISTS idx_boda_riders_online ON boda_riders(is_online, city) WHERE is_online = TRUE;

ALTER TABLE boda_riders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS boda_riders_select_own ON boda_riders;
DROP POLICY IF EXISTS boda_riders_insert_own ON boda_riders;
DROP POLICY IF EXISTS boda_riders_update_own ON boda_riders;

CREATE POLICY boda_riders_select_own ON boda_riders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY boda_riders_insert_own ON boda_riders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY boda_riders_update_own ON boda_riders FOR UPDATE USING (user_id = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE boda_riders; EXCEPTION WHEN duplicate_object THEN END $$;

-- ============================================================
-- 3. RESTAURANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_reg TEXT NOT NULL,
  kra_pin TEXT NOT NULL,
  cuisine_type TEXT,
  description TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  has_delivery BOOLEAN DEFAULT FALSE,
  has_pickup BOOLEAN DEFAULT TRUE,
  has_dine_in BOOLEAN DEFAULT TRUE,
  opening_time TEXT DEFAULT '08:00',
  closing_time TEXT DEFAULT '22:00',
  status TEXT DEFAULT 'pending_verification',
  is_open BOOLEAN DEFAULT FALSE,
  rating NUMERIC(2,1) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city, is_open) WHERE is_open = TRUE;

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS restaurants_select_own ON restaurants;
DROP POLICY IF EXISTS restaurants_insert_own ON restaurants;
DROP POLICY IF EXISTS restaurants_update_own ON restaurants;

CREATE POLICY restaurants_select_own ON restaurants FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY restaurants_insert_own ON restaurants FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY restaurants_update_own ON restaurants FOR UPDATE USING (owner_id = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE restaurants; EXCEPTION WHEN duplicate_object THEN END $$;

-- Restaurant Menu Items
CREATE TABLE IF NOT EXISTS restaurant_menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'General',
  is_available BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON restaurant_menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON restaurant_menu_items(restaurant_id, category);

ALTER TABLE restaurant_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS menu_items_select_own ON restaurant_menu_items;
DROP POLICY IF EXISTS menu_items_insert_own ON restaurant_menu_items;
DROP POLICY IF EXISTS menu_items_update_own ON restaurant_menu_items;

CREATE POLICY menu_items_select_own ON restaurant_menu_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
CREATE POLICY menu_items_insert_own ON restaurant_menu_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));
CREATE POLICY menu_items_update_own ON restaurant_menu_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_menu_items; EXCEPTION WHEN duplicate_object THEN END $$;

-- ============================================================
-- 4. JOB SEEKERS
-- ============================================================
CREATE TABLE IF NOT EXISTS job_seekers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  headline TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  years_experience INTEGER DEFAULT 0,
  education TEXT,
  current_role TEXT,
  current_company TEXT,
  job_types TEXT[] DEFAULT '{}',
  expected_salary NUMERIC(12,2),
  is_open_to_remote BOOLEAN DEFAULT FALSE,
  is_open_to_relocation BOOLEAN DEFAULT FALSE,
  preferred_industries TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  is_available BOOLEAN DEFAULT TRUE,
  profile_views INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_seekers_user ON job_seekers(user_id);
CREATE INDEX IF NOT EXISTS idx_job_seekers_available ON job_seekers(is_available, city) WHERE is_available = TRUE;

ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_seekers_select_own ON job_seekers;
DROP POLICY IF EXISTS job_seekers_insert_own ON job_seekers;
DROP POLICY IF EXISTS job_seekers_update_own ON job_seekers;

CREATE POLICY job_seekers_select_own ON job_seekers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY job_seekers_insert_own ON job_seekers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY job_seekers_update_own ON job_seekers FOR UPDATE USING (user_id = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE job_seekers; EXCEPTION WHEN duplicate_object THEN END $$;

-- ============================================================
-- 5. AGENT APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL,
  operating_area TEXT,
  business_name TEXT NOT NULL,
  business_reg TEXT NOT NULL,
  kra_pin TEXT NOT NULL,
  address TEXT NOT NULL,
  has_physical_shop BOOLEAN DEFAULT FALSE,
  shop_name TEXT,
  services TEXT[] DEFAULT '{}',
  daily_float NUMERIC(12,2) DEFAULT 0,
  has_till_number BOOLEAN DEFAULT FALSE,
  till_number TEXT,
  has_paybill BOOLEAN DEFAULT FALSE,
  paybill_number TEXT,
  referral_code TEXT,
  status TEXT DEFAULT 'pending_verification',
  is_active BOOLEAN DEFAULT FALSE,
  total_transactions INTEGER DEFAULT 0,
  total_commission NUMERIC(12,2) DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_apps_user ON agent_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_apps_status ON agent_applications(status);
CREATE INDEX IF NOT EXISTS idx_agent_apps_active ON agent_applications(is_active, city) WHERE is_active = TRUE;

ALTER TABLE agent_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_apps_select_own ON agent_applications;
DROP POLICY IF EXISTS agent_apps_insert_own ON agent_applications;
DROP POLICY IF EXISTS agent_apps_update_own ON agent_applications;

CREATE POLICY agent_apps_select_own ON agent_applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY agent_apps_insert_own ON agent_applications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY agent_apps_update_own ON agent_applications FOR UPDATE USING (user_id = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE agent_applications; EXCEPTION WHEN duplicate_object THEN END $$;
