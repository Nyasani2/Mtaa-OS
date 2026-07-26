-- ============================================
-- WALLET RPC FUNCTIONS FOR TAX WITHHOLDING
-- Run this in Supabase SQL Editor
-- ============================================

-- Deduct tax from user wallet and record transaction
CREATE OR REPLACE FUNCTION deduct_tax_from_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_currency TEXT,
  p_reference_id UUID,
  p_description TEXT
)
RETURNS VOID AS $$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_account_id UUID;
BEGIN
  -- Find user's default wallet account for this currency
  SELECT id, wallet_id, balance
  INTO v_account_id, v_wallet_id, v_balance
  FROM wallet_accounts
  WHERE user_id = p_user_id
    AND currency = p_currency
    AND is_default = true
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No wallet account found for user % in currency %', p_user_id, p_currency;
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance: % < %', v_balance, p_amount;
  END IF;

  -- Deduct from wallet account
  UPDATE wallet_accounts
  SET balance = balance - p_amount,
      available_balance = available_balance - p_amount,
      updated_at = NOW()
  WHERE id = v_account_id;

  -- Record wallet transaction
  INSERT INTO wallet_transactions (
    user_id,
    wallet_id,
    amount,
    type,
    status,
    description,
    reference_id,
    reference_type,
    currency,
    balance_after,
    completed_at,
    transaction_type
  ) VALUES (
    p_user_id,
    v_wallet_id,
    -p_amount,
    'debit',
    'completed',
    p_description,
    p_reference_id,
    'tax_withholding',
    p_currency,
    v_balance - p_amount,
    NOW(),
    'tax_withholding'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transfer withheld tax to authority wallet
CREATE OR REPLACE FUNCTION transfer_to_authority_wallet(
  p_authority_wallet_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_description TEXT
)
RETURNS VOID AS $$
DECLARE
  v_account_id UUID;
  v_balance NUMERIC;
BEGIN
  -- Find authority wallet account
  SELECT id, balance
  INTO v_account_id, v_balance
  FROM wallet_accounts
  WHERE wallet_id = p_authority_wallet_id
    AND currency = p_currency
  LIMIT 1;

  IF v_account_id IS NULL THEN
    -- Create authority account if not exists
    INSERT INTO wallet_accounts (user_id, wallet_id, account_type, currency, balance, available_balance, status, is_default)
    VALUES (
      '00000000-0000-0000-0000-000000000000', -- system user
      p_authority_wallet_id,
      'authority',
      p_currency,
      0,
      0,
      'active',
      true
    )
    RETURNING id INTO v_account_id;
  END IF;

  -- Credit authority wallet
  UPDATE wallet_accounts
  SET balance = balance + p_amount,
      available_balance = available_balance + p_amount,
      updated_at = NOW()
  WHERE id = v_account_id;

  -- Record authority transaction
  INSERT INTO wallet_transactions (
    user_id,
    wallet_id,
    amount,
    type,
    status,
    description,
    currency,
    balance_after,
    completed_at,
    transaction_type
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    p_authority_wallet_id,
    p_amount,
    'credit',
    'completed',
    p_description,
    p_currency,
    COALESCE(v_balance, 0) + p_amount,
    NOW(),
    'tax_remittance'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tax summary for a user across all jurisdictions
CREATE OR REPLACE FUNCTION get_user_tax_summary(p_user_id UUID)
RETURNS TABLE (
  jurisdiction_code TEXT,
  total_withheld NUMERIC,
  total_remitted NUMERIC,
  total_pending NUMERIC,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tw.jurisdiction_code,
    COALESCE(SUM(tw.amount), 0) AS total_withheld,
    COALESCE(SUM(CASE WHEN tw.status = 'remitted' THEN tw.amount ELSE 0 END), 0) AS total_remitted,
    COALESCE(SUM(CASE WHEN tw.status = 'pending' THEN tw.amount ELSE 0 END), 0) AS total_pending,
    COUNT(*) AS transaction_count
  FROM tax_withholdings tw
  WHERE tw.taxpayer_id = p_user_id
  GROUP BY tw.jurisdiction_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
