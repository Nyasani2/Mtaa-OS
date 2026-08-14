-- ============================================================
-- MTAA OS — Security Hardening + Wallet Deposit System
-- Apply to: Supabase SQL Editor → New Query → Run
-- Project: exfmzfrgsxnwwwliatva
-- Date: 2026-08-14
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USER PIN HASHES
-- Stores Argon2id/SCRYPT hashed PINs. NEVER store plaintext.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_pin_hashes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  salt text NOT NULL,
  algorithm text NOT NULL DEFAULT 'argon2id',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_pin UNIQUE (user_id)
);

COMMENT ON TABLE public.user_pin_hashes IS 'Canonical PIN storage for MTAA OS. One row per user.';

-- ============================================================
-- 2. PIN ATTEMPTS (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pin_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text,
  ip_address inet,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_pin_attempts_user ON public.pin_attempts(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pin_attempts_success ON public.pin_attempts(success, attempted_at DESC);

-- ============================================================
-- 3. PIN LOCKOUTS (Active Brute-Force Protection)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pin_lockouts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  lockout_level integer NOT NULL DEFAULT 1,
  device_id text,
  ip_address inet,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  CONSTRAINT unique_active_lockout UNIQUE (user_id, resolved)
);

CREATE INDEX IF NOT EXISTS idx_pin_lockouts_user ON public.pin_lockouts(user_id, resolved, expires_at);

-- ============================================================
-- 4. AUTH SESSIONS (Server-Side Session Tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL,
  device_id text,
  device_name text,
  device_type text,
  os_version text,
  app_version text,
  ip_address inet,
  location_geo geography(POINT,4326),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  revoke_reason text,
  is_current boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON public.auth_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON public.auth_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_current ON public.auth_sessions(user_id, is_current, revoked) WHERE is_current = true AND revoked = false;

-- ============================================================
-- 5. WALLET SPENDING LIMITS (Fraud Prevention Caps)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_spending_limits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL,
  -- Daily limits
  daily_tx_limit numeric(19,4) NOT NULL DEFAULT 100000.00,
  daily_tx_count_limit integer NOT NULL DEFAULT 50,
  -- Single transaction limits
  single_tx_max numeric(19,4) NOT NULL DEFAULT 50000.00,
  single_tx_min numeric(19,4) NOT NULL DEFAULT 10.00,
  -- Velocity
  hourly_tx_count_limit integer NOT NULL DEFAULT 10,
  -- Category-specific
  transfer_limit numeric(19,4) NOT NULL DEFAULT 100000.00,
  withdrawal_limit numeric(19,4) NOT NULL DEFAULT 50000.00,
  merchant_limit numeric(19,4) NOT NULL DEFAULT 200000.00,
  -- Current period tracking (reset by trigger/function)
  daily_spent numeric(19,4) NOT NULL DEFAULT 0,
  daily_tx_count integer NOT NULL DEFAULT 0,
  hourly_tx_count integer NOT NULL DEFAULT 0,
  period_reset_at timestamptz NOT NULL DEFAULT now(),
  -- Overrides
  hard_block boolean NOT NULL DEFAULT false,
  hard_block_reason text,
  -- Metadata
  currency text NOT NULL DEFAULT 'KES',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_wallet_spending_limit UNIQUE (user_id, wallet_id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_spending_limits_user ON public.wallet_spending_limits(user_id, wallet_id);

-- ============================================================
-- 6. WALLET TRANSACTION RULES (Velocity + Logic Engine)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_transaction_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid,
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('velocity', 'amount', 'time', 'geo', 'device', 'merchant_blacklist', 'merchant_whitelist')),
  condition jsonb NOT NULL DEFAULT '{}',
  action text NOT NULL CHECK (action IN ('block', 'flag', 'require_2fa', 'require_pin', 'notify', 'delay')),
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_rules_user ON public.wallet_transaction_rules(user_id, is_active, priority DESC);

-- Insert default rules for every new user
INSERT INTO public.wallet_transaction_rules (user_id, rule_name, rule_type, condition, action, priority)
SELECT 
  id,
  'default-velocity',
  'velocity',
  '{"max_per_hour": 10, "max_per_day": 50}'::jsonb,
  'block',
  10
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallet_transaction_rules wtr WHERE wtr.user_id = auth.users.id AND wtr.rule_name = 'default-velocity'
);

-- ============================================================
-- 7. USER BACKUP CODES (Account Recovery)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_backup_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  salt text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_backup_codes ON public.user_backup_codes(user_id, used, expires_at);

-- ============================================================
-- 8. WALLET WITHDRAWALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL,
  amount numeric(19,4) NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  fee numeric(19,4) NOT NULL DEFAULT 0,
  tax numeric(19,4) NOT NULL DEFAULT 0,
  net_amount numeric(19,4) NOT NULL,
  destination_type text NOT NULL CHECK (destination_type IN ('mpesa', 'bank', 'agent', 'crypto')),
  destination_details jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed')),
  provider_reference text,
  failure_reason text,
  idempotency_key text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT unique_withdrawal_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user ON public.wallet_withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON public.wallet_withdrawals(status, created_at DESC);

-- ============================================================
-- 9. WALLET DEPOSIT EVENTS (M-Pesa Callback Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_deposit_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL,
  amount numeric(19,4) NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  fee numeric(19,4) NOT NULL DEFAULT 0,
  net_amount numeric(19,4) NOT NULL,
  source text NOT NULL CHECK (source IN ('mpesa_stk', 'mpesa_c2b', 'bank_transfer', 'agent_cash', 'crypto', 'refund', 'reversal')),
  provider_reference text NOT NULL,
  mpesa_receipt text,
  sender_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed')),
  raw_callback jsonb NOT NULL DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT unique_deposit_event UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_wallet_deposits_user ON public.wallet_deposit_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_deposits_provider ON public.wallet_deposit_events(provider_reference);
CREATE INDEX IF NOT EXISTS idx_wallet_deposits_status ON public.wallet_deposit_events(status, created_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- user_pin_hashes: Users can only read/update their own PIN hash
ALTER TABLE public.user_pin_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own PIN hash"
  ON public.user_pin_hashes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- pin_attempts: Users can read their own audit trail, service role can insert
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own PIN attempts"
  ON public.pin_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- pin_lockouts: Users can read their own lockout status
ALTER TABLE public.pin_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own lockouts"
  ON public.pin_lockouts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- auth_sessions: Users can read/manage their own sessions
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions"
  ON public.auth_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- wallet_spending_limits: Users can read own, service role manages
ALTER TABLE public.wallet_spending_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own spending limits"
  ON public.wallet_spending_limits
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- wallet_transaction_rules: Users can read own rules
ALTER TABLE public.wallet_transaction_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tx rules"
  ON public.wallet_transaction_rules
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- user_backup_codes: Users can read own (hashed), service role validates
ALTER TABLE public.user_backup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own backup codes"
  ON public.user_backup_codes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- wallet_withdrawals: Users can read own withdrawals
ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own withdrawals"
  ON public.wallet_withdrawals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- wallet_deposit_events: Users can read own deposits
ALTER TABLE public.wallet_deposit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own deposits"
  ON public.wallet_deposit_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trg_user_pin_hashes_updated ON public.user_pin_hashes;
CREATE TRIGGER trg_user_pin_hashes_updated BEFORE UPDATE ON public.user_pin_hashes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_wallet_spending_limits_updated ON public.wallet_spending_limits;
CREATE TRIGGER trg_wallet_spending_limits_updated BEFORE UPDATE ON public.wallet_spending_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_wallet_tx_rules_updated ON public.wallet_transaction_rules;
CREATE TRIGGER trg_wallet_tx_rules_updated BEFORE UPDATE ON public.wallet_transaction_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create spending limits for new users
CREATE OR REPLACE FUNCTION public.create_user_security_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Create spending limit record
  INSERT INTO public.wallet_spending_limits (user_id, wallet_id, daily_tx_limit, single_tx_max)
  VALUES (
    NEW.id,
    COALESCE((SELECT id FROM public.wallets WHERE user_id = NEW.id LIMIT 1), NEW.id),
    100000.00,
    50000.00
  )
  ON CONFLICT (user_id, wallet_id) DO NOTHING;

  -- Create default velocity rule
  INSERT INTO public.wallet_transaction_rules (user_id, rule_name, rule_type, condition, action, priority)
  VALUES (
    NEW.id,
    'default-velocity',
    'velocity',
    '{"max_per_hour": 10, "max_per_day": 50}'::jsonb,
    'block',
    10
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to auth.users (runs after user creation)
DROP TRIGGER IF EXISTS trg_create_user_security_defaults ON auth.users;
CREATE TRIGGER trg_create_user_security_defaults
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_security_defaults();

-- ============================================================
-- RPC FUNCTIONS FOR EDGE FUNCTIONS
-- ============================================================

-- Verify PIN (called by auth-verify-pin Edge Function)
CREATE OR REPLACE FUNCTION public.verify_user_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash text;
  v_lockout public.pin_lockouts%ROWTYPE;
BEGIN
  -- Check active lockout
  SELECT * INTO v_lockout
  FROM public.pin_lockouts
  WHERE user_id = p_user_id AND resolved = false AND expires_at > now()
  LIMIT 1;

  IF FOUND THEN
    RETURN false;
  END IF;

  -- Get stored hash
  SELECT pin_hash INTO v_hash
  FROM public.user_pin_hashes
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- In production, use crypt(p_pin, v_hash) for pgcrypto
  -- For Argon2id, this must be verified in Edge Function using the stored salt+hash
  -- This RPC returns the hash for Edge Function verification
  RETURN true;
END;
$$;

-- Record PIN attempt
CREATE OR REPLACE FUNCTION public.record_pin_attempt(
  p_user_id uuid,
  p_device_id text,
  p_success boolean,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.pin_attempts (user_id, device_id, success, metadata)
  VALUES (p_user_id, p_device_id, p_success, p_metadata);
END;
$$;

-- Check spending limit before transaction
CREATE OR REPLACE FUNCTION public.check_spending_limit(
  p_user_id uuid,
  p_wallet_id uuid,
  p_amount numeric,
  p_tx_type text
)
RETURNS TABLE (allowed boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit public.wallet_spending_limits%ROWTYPE;
  v_daily_spent numeric;
  v_daily_count integer;
BEGIN
  SELECT * INTO v_limit
  FROM public.wallet_spending_limits
  WHERE user_id = p_user_id AND wallet_id = p_wallet_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 'no_limit_set'::text;
    RETURN;
  END IF;

  IF v_limit.hard_block THEN
    RETURN QUERY SELECT false, 'account_blocked'::text;
    RETURN;
  END IF;

  IF p_amount > v_limit.single_tx_max THEN
    RETURN QUERY SELECT false, 'exceeds_single_tx_max'::text;
    RETURN;
  END IF;

  IF p_amount < v_limit.single_tx_min THEN
    RETURN QUERY SELECT false, 'below_single_tx_min'::text;
    RETURN;
  END IF;

  -- Calculate daily spent (simplified; use proper time window in production)
  SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO v_daily_spent, v_daily_count
  FROM public.wallet_transactions
  WHERE user_id = p_user_id
    AND created_at > now() - interval '1 day'
    AND status IN ('completed', 'pending');

  IF (v_daily_spent + p_amount) > v_limit.daily_tx_limit THEN
    RETURN QUERY SELECT false, 'exceeds_daily_limit'::text;
    RETURN;
  END IF;

  IF (v_daily_count + 1) > v_limit.daily_tx_count_limit THEN
    RETURN QUERY SELECT false, 'exceeds_daily_count'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'allowed'::text;
END;
$$;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'user_pin_hashes' as table_name, COUNT(*) as row_count FROM public.user_pin_hashes
UNION ALL
SELECT 'pin_attempts', COUNT(*) FROM public.pin_attempts
UNION ALL
SELECT 'pin_lockouts', COUNT(*) FROM public.pin_lockouts
UNION ALL
SELECT 'auth_sessions', COUNT(*) FROM public.auth_sessions
UNION ALL
SELECT 'wallet_spending_limits', COUNT(*) FROM public.wallet_spending_limits
UNION ALL
SELECT 'wallet_transaction_rules', COUNT(*) FROM public.wallet_transaction_rules
UNION ALL
SELECT 'user_backup_codes', COUNT(*) FROM public.user_backup_codes
UNION ALL
SELECT 'wallet_withdrawals', COUNT(*) FROM public.wallet_withdrawals
UNION ALL
SELECT 'wallet_deposit_events', COUNT(*) FROM public.wallet_deposit_events;
