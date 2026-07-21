-- MStudio Service RPC Functions
-- Run this in Supabase SQL Editor

-- ─── execute_p2p_transfer ───
-- Atomic P2P transfer with platform fee deduction
CREATE OR REPLACE FUNCTION execute_p2p_transfer(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'KES',
  p_description TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_platform_fee NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_wallet_id UUID;
  v_receiver_wallet_id UUID;
  v_platform_wallet_id UUID;
  v_transaction_id UUID;
  v_total_debit NUMERIC;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  v_total_debit := p_amount;

  -- Lock sender wallet
  SELECT id INTO v_sender_wallet_id
  FROM wallet_accounts
  WHERE user_id = p_sender_id AND currency = p_currency AND is_default = true
  FOR UPDATE;

  IF v_sender_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Sender wallet not found for currency %', p_currency;
  END IF;

  -- Check balance
  IF (SELECT balance FROM wallet_accounts WHERE id = v_sender_wallet_id) < v_total_debit THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Lock receiver wallet
  SELECT id INTO v_receiver_wallet_id
  FROM wallet_accounts
  WHERE user_id = p_receiver_id AND currency = p_currency AND is_default = true
  FOR UPDATE;

  IF v_receiver_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Receiver wallet not found for currency %', p_currency;
  END IF;

  -- Debit sender
  UPDATE wallet_accounts
  SET balance = balance - v_total_debit,
      available_balance = available_balance - v_total_debit,
      updated_at = NOW()
  WHERE id = v_sender_wallet_id;

  -- Credit receiver (minus platform fee)
  UPDATE wallet_accounts
  SET balance = balance + (p_amount - p_platform_fee),
      available_balance = available_balance + (p_amount - p_platform_fee),
      updated_at = NOW()
  WHERE id = v_receiver_wallet_id;

  -- Credit platform fee if applicable
  IF p_platform_fee > 0 THEN
    SELECT id INTO v_platform_wallet_id
    FROM wallet_accounts
    WHERE user_id = (SELECT user_id FROM user_profiles WHERE role = 'platform' LIMIT 1)
      AND currency = p_currency
    LIMIT 1;

    IF v_platform_wallet_id IS NOT NULL THEN
      UPDATE wallet_accounts
      SET balance = balance + p_platform_fee,
          available_balance = available_balance + p_platform_fee,
          updated_at = NOW()
      WHERE id = v_platform_wallet_id;
    END IF;
  END IF;

  -- Create transaction record for sender
  INSERT INTO wallet_transactions (
    user_id, wallet_id, amount, type, status,
    description, reference_id, reference_type,
    balance_after, currency, completed_at
  )
  SELECT
    p_sender_id, v_sender_wallet_id, -v_total_debit, 'debit', 'completed',
    COALESCE(p_description, 'P2P Transfer'), p_reference_id, p_reference_type,
    balance, p_currency, NOW()
  FROM wallet_accounts WHERE id = v_sender_wallet_id
  RETURNING id INTO v_transaction_id;

  -- Create transaction record for receiver
  INSERT INTO wallet_transactions (
    user_id, wallet_id, amount, type, status,
    description, reference_id, reference_type,
    balance_after, currency, completed_at
  )
  SELECT
    p_receiver_id, v_receiver_wallet_id, (p_amount - p_platform_fee), 'credit', 'completed',
    COALESCE(p_description, 'P2P Transfer'), p_reference_id, p_reference_type,
    balance, p_currency, NOW()
  FROM wallet_accounts WHERE id = v_receiver_wallet_id;

  RETURN v_transaction_id;
END;
$$;

-- ─── studio_increment_subscriber ───
-- Safely increment subscriber count on a studio
CREATE OR REPLACE FUNCTION studio_increment_subscriber(p_studio_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE studio_studios
  SET subscriber_count = COALESCE(subscriber_count, 0) + 1,
      updated_at = NOW()
  WHERE id = p_studio_id;
END;
$$;

-- ─── Grant permissions ───
GRANT EXECUTE ON FUNCTION execute_p2p_transfer(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION studio_increment_subscriber(UUID) TO authenticated;
