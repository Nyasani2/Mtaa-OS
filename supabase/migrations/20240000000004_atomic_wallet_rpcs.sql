-- MTAA OS ATOMIC WALLET OPERATIONS
-- Run this in Supabase SQL Editor to prevent race conditions and double-spending.

-- 1. ATOMIC DEBIT (Used for sending, paying, converting)
CREATE OR REPLACE FUNCTION mtaa_wallet_debit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_currency TEXT,
  p_description TEXT,
  p_transaction_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_wallet RECORD;
  v_tx_id UUID;
BEGIN
  -- Check authentication
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock the wallet row to prevent concurrent modifications
  SELECT * INTO v_wallet 
  FROM wallet_accounts 
  WHERE user_id = p_user_id AND currency = p_currency AND is_default = true 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_wallet.available_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient available balance');
  END IF;

  -- Update balances
  UPDATE wallet_accounts 
  SET available_balance = available_balance - p_amount, 
      balance = balance - p_amount, 
      updated_at = now() 
  WHERE id = v_wallet.id;

  -- Insert transaction record
  INSERT INTO wallet_transactions (
    user_id, wallet_id, type, amount, currency, status, description, 
    direction, balance_after, transaction_type, metadata
  )
  VALUES (
    p_user_id, v_wallet.id, 'debit', p_amount, p_currency, 'completed', p_description,
    'outgoing', v_wallet.available_balance - p_amount, p_transaction_type, p_metadata
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id, 'wallet_id', v_wallet.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ATOMIC CREDIT (Used for receiving money, refunds)
CREATE OR REPLACE FUNCTION mtaa_wallet_credit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_currency TEXT,
  p_description TEXT,
  p_transaction_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_wallet RECORD;
  v_tx_id UUID;
BEGIN
  -- Find or create wallet
  SELECT * INTO v_wallet 
  FROM wallet_accounts 
  WHERE user_id = p_user_id AND currency = p_currency AND is_default = true;

  IF NOT FOUND THEN
    INSERT INTO wallet_accounts (user_id, currency, is_default, status, balance, available_balance)
    VALUES (p_user_id, p_currency, true, 'active', 0, 0)
    RETURNING * INTO v_wallet;
  END IF;

  -- Update balances
  UPDATE wallet_accounts 
  SET available_balance = available_balance + p_amount, 
      balance = balance + p_amount, 
      updated_at = now() 
  WHERE id = v_wallet.id;

  -- Insert transaction record
  INSERT INTO wallet_transactions (
    user_id, wallet_id, type, amount, currency, status, description, 
    direction, balance_after, transaction_type, metadata
  )
  VALUES (
    p_user_id, v_wallet.id, 'credit', p_amount, p_currency, 'completed', p_description,
    'incoming', v_wallet.available_balance + p_amount, p_transaction_type, p_metadata
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id, 'wallet_id', v_wallet.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
