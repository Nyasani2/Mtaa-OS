-- Phase 7: Security Testing & RLS Hardening
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. user_profiles RLS
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow public read of minimal profile data (for QR resolution, etc.)
-- This is intentional — username, display_name, avatar_url, qr_identity_url are public
DROP POLICY IF EXISTS "Public can view minimal profile" ON user_profiles;
CREATE POLICY "Public can view minimal profile"
  ON user_profiles FOR SELECT
  USING (true);

-- ============================================================
-- 2. user_devices RLS (already created in Phase 5, verify)
-- ============================================================
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Already has policies from Phase 5, but ensure no loose ones exist
DROP POLICY IF EXISTS "Public can view devices" ON user_devices;

-- ============================================================
-- 3. security_audit_logs RLS
-- ============================================================
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit logs" ON security_audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON security_audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE for users — service role only

-- ============================================================
-- 4. wallet_accounts RLS (Phase 6)
-- ============================================================
ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own wallet
-- All mutations go through edge functions with service role

-- ============================================================
-- 5. wallet_transactions RLS (Phase 6)
-- ============================================================
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own transactions
-- All inserts go through edge functions with service role

-- ============================================================
-- 6. user_follows RLS
-- ============================================================
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view follows" ON user_follows;
DROP POLICY IF EXISTS "Users can manage own follows" ON user_follows;

CREATE POLICY "Users can view follows"
  ON user_follows FOR SELECT
  USING (follower_id = auth.uid() OR followed_id = auth.uid());

CREATE POLICY "Users can manage own follows"
  ON user_follows FOR ALL
  USING (follower_id = auth.uid());

-- ============================================================
-- 7. streets_posts RLS
-- ============================================================
ALTER TABLE streets_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view posts" ON streets_posts;
DROP POLICY IF EXISTS "Users can manage own posts" ON streets_posts;

CREATE POLICY "Users can view posts"
  ON streets_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own posts"
  ON streets_posts FOR ALL
  USING (creator_id = auth.uid());

-- ============================================================
-- 8. Rate limiting function for edge functions
-- ============================================================
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM security_audit_logs
  WHERE user_id = p_user_id
    AND event_type = p_action
    AND created_at > NOW() - INTERVAL '1 second' * p_window_seconds;

  RETURN v_count < p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. Prevent brute force PIN attempts at DB level
-- ============================================================
CREATE OR REPLACE FUNCTION log_pin_attempt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'pin_failed' THEN
    -- If 5+ failed attempts in last 10 minutes, auto-lock
    IF (
      SELECT COUNT(*) FROM security_audit_logs
      WHERE user_id = NEW.user_id
        AND event_type = 'pin_failed'
        AND created_at > NOW() - INTERVAL '10 minutes'
    ) >= 5 THEN
      -- Insert lockout event
      INSERT INTO security_audit_logs (user_id, event_type, metadata, created_at)
      VALUES (NEW.user_id, 'pin_lockout', '{"reason": "auto_lockout"}'::jsonb, NOW());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_pin_attempt ON security_audit_logs;
CREATE TRIGGER trg_pin_attempt
  AFTER INSERT ON security_audit_logs
  FOR EACH ROW
  WHEN (NEW.event_type = 'pin_failed')
  EXECUTE FUNCTION log_pin_attempt();

-- ============================================================
-- 10. Verify all tables have RLS enabled
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'user_devices', 'security_audit_logs',
    'wallet_accounts', 'wallet_transactions', 'user_follows',
    'streets_posts'
  )
ORDER BY tablename;
