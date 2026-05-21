CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_transaction_id UUID,
  p_description TEXT DEFAULT 'Deposit'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.wallets SET balance = balance + p_amount, updated_at = NOW() WHERE id = p_wallet_id;
  INSERT INTO public.ledger_events (wallet_id, transaction_id, event_type, amount, balance_after, description, created_at)
  SELECT p_wallet_id, p_transaction_id, 'credit', p_amount, balance, p_description, NOW() FROM public.wallets WHERE id = p_wallet_id;
  UPDATE public.app_transactions SET status = 'completed', updated_at = NOW() WHERE id = p_transaction_id AND status = 'pending';
END;
$$;
GRANT EXECUTE ON FUNCTION public.credit_wallet(UUID, NUMERIC, UUID, TEXT) TO authenticated;
