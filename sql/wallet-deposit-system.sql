-- MTAA Bank-to-Wallet Deposit System Migration
-- Run this in Supabase SQL Editor

-- ─── 1. Ensure user_profiles has phone column ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone TEXT UNIQUE;
    CREATE INDEX idx_user_profiles_phone ON user_profiles(phone);
  END IF;
END $$;

-- ─── 2. Create wallet_withdrawals table if not exists ───
CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  wallet_id UUID REFERENCES wallet_accounts(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  phone_number TEXT,
  till_number TEXT,
  mpesa_receipt TEXT,
  failure_reason TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user ON wallet_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON wallet_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_created ON wallet_withdrawals(created_at DESC);

-- ─── 3. Create wallet_deposit_events table if not exists ───
CREATE TABLE IF NOT EXISTS wallet_deposit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID REFERENCES wallet_deposits(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('received', 'auto_credited', 'unclaimed', 'claimed', 'credit_failed', 'refunded')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_deposit_events_deposit ON wallet_deposit_events(deposit_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_events_type ON wallet_deposit_events(event_type);

-- ─── 4. Add missing columns to wallet_deposits ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_deposits' AND column_name = 'currency'
  ) THEN
    ALTER TABLE wallet_deposits ADD COLUMN currency TEXT NOT NULL DEFAULT 'KES';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_deposits' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE wallet_deposits ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_deposits' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE wallet_deposits ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- ─── 5. Create credit_wallet RPC ───
CREATE OR REPLACE FUNCTION credit_wallet(
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_transaction_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  -- Lock wallet and get user_id
  SELECT user_id INTO v_user_id
  FROM wallet_accounts
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- Credit wallet
  UPDATE wallet_accounts
  SET balance = balance + p_amount,
      available_balance = available_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_wallet_id;

  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id, wallet_id, amount, type, status,
    description, reference_id, reference_type,
    balance_after, currency, completed_at
  )
  SELECT
    v_user_id, p_wallet_id, p_amount, 'credit', 'completed',
    COALESCE(p_description, 'Wallet credit'), p_reference_id, p_reference_type,
    balance, currency, NOW()
  FROM wallet_accounts WHERE id = p_wallet_id
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

-- ─── 6. Create hold_wallet_funds RPC ───
CREATE OR REPLACE FUNCTION hold_wallet_funds(
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  UPDATE wallet_accounts
  SET available_balance = available_balance - p_amount,
      hold_balance = hold_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_wallet_id
    AND available_balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;
END;
$$;

-- ─── 7. Create release_wallet_hold RPC ───
CREATE OR REPLACE FUNCTION release_wallet_hold(
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallet_accounts
  SET available_balance = available_balance + p_amount,
      hold_balance = GREATEST(hold_balance - p_amount, 0),
      updated_at = NOW()
  WHERE id = p_wallet_id;
END;
$$;

-- ─── 8. Create debit_wallet RPC ───
CREATE OR REPLACE FUNCTION debit_wallet(
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_transaction_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  SELECT user_id INTO v_user_id
  FROM wallet_accounts
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  UPDATE wallet_accounts
  SET balance = balance - p_amount,
      hold_balance = GREATEST(hold_balance - p_amount, 0),
      updated_at = NOW()
  WHERE id = p_wallet_id
    AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  INSERT INTO wallet_transactions (
    user_id, wallet_id, amount, type, status,
    description, reference_id, reference_type,
    balance_after, currency, completed_at
  )
  SELECT
    v_user_id, p_wallet_id, -p_amount, 'debit', 'completed',
    COALESCE(p_description, 'Wallet debit'), p_reference_id, p_reference_type,
    balance, currency, NOW()
  FROM wallet_accounts WHERE id = p_wallet_id
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

-- ─── 9. Create claim_unclaimed_deposit function ───
CREATE OR REPLACE FUNCTION claim_unclaimed_deposit(
  p_deposit_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deposit RECORD;
  v_wallet_id UUID;
BEGIN
  -- Get deposit
  SELECT * INTO v_deposit
  FROM wallet_deposits
  WHERE id = p_deposit_id AND status = 'unclaimed'
  FOR UPDATE;

  IF v_deposit IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Find user's wallet
  SELECT id INTO v_wallet_id
  FROM wallet_accounts
  WHERE user_id = p_user_id AND currency = v_deposit.currency AND is_default = true;

  IF v_wallet_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Credit wallet
  PERFORM credit_wallet(v_wallet_id, v_deposit.amount, 'Claimed unclaimed deposit', 'unclaimed_deposit', p_deposit_id);

  -- Update deposit
  UPDATE wallet_deposits
  SET user_id = p_user_id,
      wallet_id = v_wallet_id,
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_deposit_id;

  -- Log event
  INSERT INTO wallet_deposit_events (deposit_id, event_type, details)
  VALUES (p_deposit_id, 'claimed', { 'claimed_by': p_user_id, 'wallet_id': v_wallet_id });

  RETURN TRUE;
END;
$$;

-- ─── 10. RLS Policies ───
ALTER TABLE wallet_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_deposit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals"
  ON wallet_withdrawals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own withdrawals"
  ON wallet_withdrawals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own deposit events"
  ON wallet_deposit_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM wallet_deposits wd 
    WHERE wd.id = wallet_deposit_events.deposit_id 
    AND wd.user_id = auth.uid()
  ));

-- ─── 11. Grant permissions ───
GRANT EXECUTE ON FUNCTION credit_wallet(UUID, NUMERIC, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION hold_wallet_funds(UUID, NUMERIC, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION release_wallet_hold(UUID, NUMERIC, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION debit_wallet(UUID, NUMERIC, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_unclaimed_deposit(UUID, UUID) TO authenticated;
