-- Onboarding Schema Fix: Jobs, Agent, Restaurant
-- Run this in Supabase SQL Editor

-- ============================================================
-- JOBS: Add missing columns to worker_profiles
-- ============================================================
ALTER TABLE worker_profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS current_role TEXT,
  ADD COLUMN IF NOT EXISTS current_company TEXT,
  ADD COLUMN IF NOT EXISTS job_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expected_salary NUMERIC,
  ADD COLUMN IF NOT EXISTS is_open_to_remote BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_open_to_relocation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preferred_industries TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ============================================================
-- AGENT: Add missing columns to agents
-- ============================================================
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS business_reg TEXT,
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS daily_float NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_till_number BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS till_number TEXT,
  ADD COLUMN IF NOT EXISTS has_paybill BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS paybill_number TEXT,
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT FALSE;

-- ============================================================
-- RESTAURANT: Create restaurants table
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_reg TEXT,
  kra_pin TEXT,
  cuisine_type TEXT,
  description TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  has_delivery BOOLEAN DEFAULT FALSE,
  has_pickup BOOLEAN DEFAULT FALSE,
  has_dine_in BOOLEAN DEFAULT FALSE,
  opening_time TIME,
  closing_time TIME,
  status TEXT DEFAULT 'pending_verification',
  rating NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  is_open BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on restaurants
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can manage their own restaurants
CREATE POLICY "Restaurant owners can manage their restaurants"
  ON restaurants FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Public can view verified restaurants
CREATE POLICY "Public can view verified restaurants"
  ON restaurants FOR SELECT
  USING (status = 'verified');

-- Add restaurant_id to restaurant_staff if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurant_staff' AND column_name = 'restaurant_id'
  ) THEN
    ALTER TABLE restaurant_staff ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);
  END IF;
END $$;

-- ============================================================
-- CASHPOINT: Add agent_float tracking columns
-- ============================================================
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS cashpoint_name TEXT,
  ADD COLUMN IF NOT EXISTS cashpoint_location TEXT,
  ADD COLUMN IF NOT EXISTS daily_deposit_limit NUMERIC DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS daily_withdrawal_limit NUMERIC DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS transaction_fee_rate NUMERIC DEFAULT 0.01;
