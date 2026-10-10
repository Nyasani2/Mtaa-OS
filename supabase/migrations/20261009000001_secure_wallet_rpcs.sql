-- Migration: Secure wallet RPCs with auth.uid() IS NULL checks
-- Fixes: Unauthenticated wallet crediting vulnerability (P0)
-- Note: This captures the live, secure function bodies that were hotfixed directly in Supabase.
-- Date: 2026-10-09

CREATE OR REPLACE FUNCTION mtaa_wallet_credit(
  p_user_id uuid, 
  p_amount numeric, 
  p_currency text, 
  p_description text, 
  p_transaction_type text, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_current_balance numeric;
BEGIN
  -- SECURE: Explicitly block unauthenticated (anon) calls
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized: Authentication required'; END IF;
  IF auth.uid() != p_user_id AND auth.role() != 'service_role' THEN 
    RAISE EXCEPTION 'Unauthorized: You can only credit your own wallet'; 
  END IF;

  INSERT INTO wallet_accounts (user_id, balance, available_balance, currency)
  VALUES (p_user_id, 0, 0, p_currency) ON CONFLICT (user_id, currency) DO NOTHING;

  UPDATE wallet_accounts 
  SET balance = balance + p_amount, available_balance = available_balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency
  RETURNING balance INTO v_current_balance;

  INSERT INTO wallet_transactions (user_id, amount, currency, description, transaction_type, metadata, status, created_at)
  VALUES (p_user_id, p_amount, p_currency, p_description, p_transaction_type, p_metadata, 'completed', NOW());

  RETURN jsonb_build_object('success', true, 'new_balance', v_current_balance);
END; $$;

CREATE OR REPLACE FUNCTION mtaa_wallet_debit(
  p_user_id uuid, 
  p_amount numeric, 
  p_currency text, 
  p_description text, 
  p_transaction_type text, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_current_balance numeric;
BEGIN
  -- SECURE: Explicitly block unauthenticated (anon) calls
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized: Authentication required'; END IF;
  IF auth.uid() != p_user_id THEN RAISE EXCEPTION 'Unauthorized: You can only debit your own wallet'; END IF;

  SELECT balance INTO v_current_balance FROM wallet_accounts WHERE user_id = p_user_id AND currency = p_currency FOR UPDATE;
  IF v_current_balance IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF v_current_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  UPDATE wallet_accounts SET balance = v_current_balance - p_amount, available_balance = available_balance - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency;

  INSERT INTO wallet_transactions (user_id, amount, currency, description, transaction_type, metadata, status, created_at)
  VALUES (p_user_id, -p_amount, p_currency, p_description, p_transaction_type, p_metadata, 'completed', NOW());

  RETURN jsonb_build_object('success', true, 'new_balance', v_current_balance - p_amount);
END; $$;

-- Revoke public/anon access, grant only to appropriate roles
REVOKE EXECUTE ON FUNCTION mtaa_wallet_credit(uuid, numeric, text, text, text, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION mtaa_wallet_credit(uuid, numeric, text, text, text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION mtaa_wallet_debit(uuid, numeric, text, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION mtaa_wallet_debit(uuid, numeric, text, text, text, jsonb) TO authenticated, service_role;
