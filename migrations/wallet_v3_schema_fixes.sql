
-- ============================================================
-- MISSING TABLES (referenced by existing edge functions)
-- Add to your existing schema before running consolidated functions
-- ============================================================

-- wallet_savings_members (referenced by old wallet-savings-goal.ts)
CREATE TABLE IF NOT EXISTS wallet_savings_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  savings_id uuid NOT NULL REFERENCES wallet_savings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_name text,
  role text DEFAULT 'member', -- admin, member
  contribution_amount decimal(15,2) DEFAULT 0.00,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(savings_id, user_id)
);

-- Enable RLS
ALTER TABLE wallet_savings_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_savings_members ON wallet_savings_members FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- SCHEMA FIXES for existing functions
-- These columns need to exist for the consolidated functions to work
-- ============================================================

-- Add missing columns to gofund_campaigns (if not already present)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gofund_campaigns' AND column_name = 'campaign_type') THEN
    ALTER TABLE gofund_campaigns ADD COLUMN campaign_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gofund_campaigns' AND column_name = 'current_amount') THEN
    ALTER TABLE gofund_campaigns ADD COLUMN current_amount decimal(15,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gofund_campaigns' AND column_name = 'donor_count') THEN
    ALTER TABLE gofund_campaigns ADD COLUMN donor_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gofund_campaigns' AND column_name = 'is_completed') THEN
    ALTER TABLE gofund_campaigns ADD COLUMN is_completed boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gofund_campaigns' AND column_name = 'completed_at') THEN
    ALTER TABLE gofund_campaigns ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Add missing columns to wallet_savings (if not already present)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_savings' AND column_name = 'total_contributions') THEN
    ALTER TABLE wallet_savings ADD COLUMN total_contributions integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_savings' AND column_name = 'is_completed') THEN
    ALTER TABLE wallet_savings ADD COLUMN is_completed boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_savings' AND column_name = 'completed_at') THEN
    ALTER TABLE wallet_savings ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Add missing columns to wallet_partner_applications (if not already present)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_partner_applications' AND column_name = 'contract_signed') THEN
    ALTER TABLE wallet_partner_applications ADD COLUMN contract_signed boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_partner_applications' AND column_name = 'activated_at') THEN
    ALTER TABLE wallet_partner_applications ADD COLUMN activated_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- INDEXES for new tables
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_savings_members_savings ON wallet_savings_members(savings_id);
CREATE INDEX IF NOT EXISTS idx_savings_members_user ON wallet_savings_members(user_id);

SELECT 'Schema fixes applied successfully' AS status;
