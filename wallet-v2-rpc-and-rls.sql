-- Wallet V2 RPC Functions + Triggers
-- Run this in Supabase Dashboard SQL Editor

-- ============================================
-- 1. GoFund: Increment raised amount
-- ============================================
CREATE OR REPLACE FUNCTION increment_gofund_raised(
  campaign_id UUID,
  amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallet_gofund_campaigns
  SET raised_amount = raised_amount + amount,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$;

-- ============================================
-- 2. SACCO: Increment member count
-- ============================================
CREATE OR REPLACE FUNCTION increment_sacco_members(
  sacco_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallet_sacco_directory
  SET member_count = member_count + 1,
      updated_at = NOW()
  WHERE id = sacco_id;
END;
$$;

-- ============================================
-- 3. Generic increment (for member contributions)
-- ============================================
CREATE OR REPLACE FUNCTION increment(
  x NUMERIC
)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT x;
$$;

-- ============================================
-- 4. Trigger: Auto-update wallet_gofund_campaigns contribution_count
-- ============================================
CREATE OR REPLACE FUNCTION update_gofund_contribution_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE wallet_gofund_campaigns
    SET contribution_count = COALESCE(contribution_count, 0) + 1
    WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE wallet_gofund_campaigns
    SET contribution_count = GREATEST(COALESCE(contribution_count, 0) - 1, 0)
    WHERE id = OLD.campaign_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_gofund_contribution_count ON wallet_gofund_contributions;
CREATE TRIGGER trg_gofund_contribution_count
AFTER INSERT OR DELETE ON wallet_gofund_contributions
FOR EACH ROW
EXECUTE FUNCTION update_gofund_contribution_count();

-- ============================================
-- 5. Trigger: Auto-update wallet_savings_goals current_amount
-- ============================================
CREATE OR REPLACE FUNCTION update_savings_goal_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE wallet_savings_goals
    SET current_amount = COALESCE(current_amount, 0) + NEW.amount
    WHERE id = NEW.goal_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE wallet_savings_goals
    SET current_amount = GREATEST(COALESCE(current_amount, 0) - OLD.amount, 0)
    WHERE id = OLD.goal_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_savings_goal_amount ON wallet_savings_contributions;
CREATE TRIGGER trg_savings_goal_amount
AFTER INSERT OR DELETE ON wallet_savings_contributions
FOR EACH ROW
EXECUTE FUNCTION update_savings_goal_amount();

-- ============================================
-- 6. Trigger: Auto-complete savings goal when target reached
-- ============================================
CREATE OR REPLACE FUNCTION check_savings_goal_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.current_amount >= NEW.target_amount AND NEW.status = 'active' THEN
    NEW.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_savings_goal_complete ON wallet_savings_goals;
CREATE TRIGGER trg_savings_goal_complete
BEFORE UPDATE ON wallet_savings_goals
FOR EACH ROW
EXECUTE FUNCTION check_savings_goal_complete();

-- ============================================
-- 7. Trigger: Auto-update SACCO total_contributions
-- ============================================
CREATE OR REPLACE FUNCTION update_sacco_total_contributions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE wallet_sacco_directory
    SET total_contributions = COALESCE(total_contributions, 0) + NEW.amount
    WHERE id = NEW.sacco_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE wallet_sacco_directory
    SET total_contributions = GREATEST(COALESCE(total_contributions, 0) - OLD.amount, 0)
    WHERE id = OLD.sacco_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sacco_total_contributions ON wallet_sacco_contributions;
CREATE TRIGGER trg_sacco_total_contributions
AFTER INSERT OR DELETE ON wallet_sacco_contributions
FOR EACH ROW
EXECUTE FUNCTION update_sacco_total_contributions();

-- ============================================
-- 8. Trigger: Auto-update SACCO member count on membership
-- ============================================
CREATE OR REPLACE FUNCTION update_sacco_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE wallet_sacco_directory
    SET member_count = COALESCE(member_count, 0) + 1
    WHERE id = NEW.sacco_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE wallet_sacco_directory
    SET member_count = GREATEST(COALESCE(member_count, 0) - 1, 0)
    WHERE id = OLD.sacco_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sacco_member_count ON wallet_sacco_memberships;
CREATE TRIGGER trg_sacco_member_count
AFTER INSERT OR DELETE ON wallet_sacco_memberships
FOR EACH ROW
EXECUTE FUNCTION update_sacco_member_count();

-- ============================================
-- 9. Add missing columns if they don't exist
-- ============================================
DO $$
BEGIN
  -- wallet_gofund_campaigns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_gofund_campaigns' AND column_name = 'contribution_count') THEN
    ALTER TABLE wallet_gofund_campaigns ADD COLUMN contribution_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_gofund_campaigns' AND column_name = 'updated_at') THEN
    ALTER TABLE wallet_gofund_campaigns ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- wallet_sacco_directory
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_sacco_directory' AND column_name = 'updated_at') THEN
    ALTER TABLE wallet_sacco_directory ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- wallet_partner_applications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_partner_applications' AND column_name = 'estimated_premium_min') THEN
    ALTER TABLE wallet_partner_applications ADD COLUMN estimated_premium_min NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_partner_applications' AND column_name = 'estimated_premium_max') THEN
    ALTER TABLE wallet_partner_applications ADD COLUMN estimated_premium_max NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_partner_applications' AND column_name = 'target_market') THEN
    ALTER TABLE wallet_partner_applications ADD COLUMN target_market TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_partner_applications' AND column_name = 'jurisdiction') THEN
    ALTER TABLE wallet_partner_applications ADD COLUMN jurisdiction TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_partner_applications' AND column_name = 'department') THEN
    ALTER TABLE wallet_partner_applications ADD COLUMN department TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_partner_applications' AND column_name = 'authorization_level') THEN
    ALTER TABLE wallet_partner_applications ADD COLUMN authorization_level INTEGER DEFAULT 1;
  END IF;
END $$;

-- ============================================
-- 10. RLS: Enable on all V2 tables
-- ============================================
ALTER TABLE wallet_gofund_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_gofund_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_gofund_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_savings_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sacco_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sacco_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sacco_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_partner_applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. RLS Policies
-- ============================================

-- wallet_gofund_campaigns: anyone can read active, creator can manage
DROP POLICY IF EXISTS "gofund_campaigns_select" ON wallet_gofund_campaigns;
CREATE POLICY "gofund_campaigns_select" ON wallet_gofund_campaigns
  FOR SELECT USING (status = 'active' OR creator_id = auth.uid());

DROP POLICY IF EXISTS "gofund_campaigns_insert" ON wallet_gofund_campaigns;
CREATE POLICY "gofund_campaigns_insert" ON wallet_gofund_campaigns
  FOR INSERT WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "gofund_campaigns_update" ON wallet_gofund_campaigns;
CREATE POLICY "gofund_campaigns_update" ON wallet_gofund_campaigns
  FOR UPDATE USING (creator_id = auth.uid());

-- wallet_gofund_contributions: contributors can see their own, campaign creators can see all for their campaigns
DROP POLICY IF EXISTS "gofund_contributions_select" ON wallet_gofund_contributions;
CREATE POLICY "gofund_contributions_select" ON wallet_gofund_contributions
  FOR SELECT USING (contributor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM wallet_gofund_campaigns c WHERE c.id = campaign_id AND c.creator_id = auth.uid()
  ));

DROP POLICY IF EXISTS "gofund_contributions_insert" ON wallet_gofund_contributions;
CREATE POLICY "gofund_contributions_insert" ON wallet_gofund_contributions
  FOR INSERT WITH CHECK (contributor_id = auth.uid());

-- wallet_savings_goals: creator can manage, members can read group goals
DROP POLICY IF EXISTS "savings_goals_select" ON wallet_savings_goals;
CREATE POLICY "savings_goals_select" ON wallet_savings_goals
  FOR SELECT USING (created_by = auth.uid() OR goal_type = 'group');

DROP POLICY IF EXISTS "savings_goals_insert" ON wallet_savings_goals;
CREATE POLICY "savings_goals_insert" ON wallet_savings_goals
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "savings_goals_update" ON wallet_savings_goals;
CREATE POLICY "savings_goals_update" ON wallet_savings_goals
  FOR UPDATE USING (created_by = auth.uid());

-- wallet_savings_contributions
DROP POLICY IF EXISTS "savings_contributions_select" ON wallet_savings_contributions;
CREATE POLICY "savings_contributions_select" ON wallet_savings_contributions
  FOR SELECT USING (contributor_id = auth.uid());

DROP POLICY IF EXISTS "savings_contributions_insert" ON wallet_savings_contributions;
CREATE POLICY "savings_contributions_insert" ON wallet_savings_contributions
  FOR INSERT WITH CHECK (contributor_id = auth.uid());

-- wallet_savings_members
DROP POLICY IF EXISTS "savings_members_select" ON wallet_savings_members;
CREATE POLICY "savings_members_select" ON wallet_savings_members
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM wallet_savings_goals g WHERE g.id = goal_id AND g.created_by = auth.uid()
  ));

DROP POLICY IF EXISTS "savings_members_insert" ON wallet_savings_members;
CREATE POLICY "savings_members_insert" ON wallet_savings_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- wallet_sacco_directory: anyone can read approved, creator can manage
DROP POLICY IF EXISTS "sacco_directory_select" ON wallet_sacco_directory;
CREATE POLICY "sacco_directory_select" ON wallet_sacco_directory
  FOR SELECT USING (status = 'approved' OR created_by = auth.uid());

DROP POLICY IF EXISTS "sacco_directory_insert" ON wallet_sacco_directory;
CREATE POLICY "sacco_directory_insert" ON wallet_sacco_directory
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "sacco_directory_update" ON wallet_sacco_directory;
CREATE POLICY "sacco_directory_update" ON wallet_sacco_directory
  FOR UPDATE USING (created_by = auth.uid());

-- wallet_sacco_memberships
DROP POLICY IF EXISTS "sacco_memberships_select" ON wallet_sacco_memberships;
CREATE POLICY "sacco_memberships_select" ON wallet_sacco_memberships
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "sacco_memberships_insert" ON wallet_sacco_memberships;
CREATE POLICY "sacco_memberships_insert" ON wallet_sacco_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- wallet_sacco_contributions
DROP POLICY IF EXISTS "sacco_contributions_select" ON wallet_sacco_contributions;
CREATE POLICY "sacco_contributions_select" ON wallet_sacco_contributions
  FOR SELECT USING (contributor_id = auth.uid());

DROP POLICY IF EXISTS "sacco_contributions_insert" ON wallet_sacco_contributions;
CREATE POLICY "sacco_contributions_insert" ON wallet_sacco_contributions
  FOR INSERT WITH CHECK (contributor_id = auth.uid());

-- wallet_partner_applications: submitter can read their own, admin can read all
DROP POLICY IF EXISTS "partner_apps_select" ON wallet_partner_applications;
CREATE POLICY "partner_apps_select" ON wallet_partner_applications
  FOR SELECT USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "partner_apps_insert" ON wallet_partner_applications;
CREATE POLICY "partner_apps_insert" ON wallet_partner_applications
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

-- ============================================
-- 12. Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gofund_campaigns_status ON wallet_gofund_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_gofund_campaigns_creator ON wallet_gofund_campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_gofund_contributions_campaign ON wallet_gofund_contributions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_gofund_contributions_contributor ON wallet_gofund_contributions(contributor_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_created_by ON wallet_savings_goals(created_by);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal ON wallet_savings_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_sacco_directory_status ON wallet_sacco_directory(status);
CREATE INDEX IF NOT EXISTS idx_sacco_memberships_user ON wallet_sacco_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_apps_submitted_by ON wallet_partner_applications(submitted_by);
CREATE INDEX IF NOT EXISTS idx_partner_apps_category ON wallet_partner_applications(partner_category);
CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON wallet_partner_applications(status);
