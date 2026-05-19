CREATE OR REPLACE FUNCTION public.transfer_funds(
  sender_id UUID,
  recipient_id UUID,
  amount NUMERIC,
  currency_code TEXT DEFAULT 'USD'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_wallet UUID;
  recipient_wallet UUID;
  sender_balance NUMERIC;
  tx_id UUID;
BEGIN
  SELECT id, balance INTO sender_wallet, sender_balance FROM public.wallets WHERE user_id = sender_id AND currency = currency_code AND status = 'active' LIMIT 1;
  IF sender_wallet IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found'); END IF;
  IF sender_balance < amount THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance'); END IF;
  SELECT id INTO recipient_wallet FROM public.wallets WHERE user_id = recipient_id AND currency = currency_code AND status = 'active' LIMIT 1;
  IF recipient_wallet IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Recipient wallet not found'); END IF;
  INSERT INTO public.app_transactions (user_id, wallet_id, amount, type, status, description, currency)
  VALUES (sender_id, sender_wallet, amount, 'debit', 'completed', 'Transfer to ' || recipient_id, currency_code) RETURNING id INTO tx_id;
  UPDATE public.wallets SET balance = balance - amount, updated_at = NOW() WHERE id = sender_wallet;
  UPDATE public.wallets SET balance = balance + amount, updated_at = NOW() WHERE id = recipient_wallet;
  INSERT INTO public.ledger_events (wallet_id, transaction_id, event_type, amount, description) VALUES (sender_wallet, tx_id, 'debit', -amount, 'Transfer out');
  INSERT INTO public.ledger_events (wallet_id, transaction_id, event_type, amount, description) VALUES (recipient_wallet, tx_id, 'credit', amount, 'Transfer in');
  RETURN jsonb_build_object('success', true, 'transaction_id', tx_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.transfer_funds(UUID, UUID, NUMERIC, TEXT) TO authenticated;
