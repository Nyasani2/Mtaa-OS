-- Phase 6: Wallet RLS hardening
-- Run this in Supabase SQL Editor

-- Ensure wallet_accounts RLS is tight
ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;

-- Drop any loose policies and recreate strict ones
DROP POLICY IF EXISTS "Users can view own wallet_accounts" ON wallet_accounts;
DROP POLICY IF EXISTS "Users can update own wallet_accounts" ON wallet_accounts;

CREATE POLICY "Users can view own wallet_accounts"
  ON wallet_accounts FOR SELECT
  USING (user_id = auth.uid());

-- Users should NOT directly update wallet_accounts — only edge functions via service role
-- If you need client-side balance display, keep SELECT only

-- wallet_transactions RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet_transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Users can insert own wallet_transactions" ON wallet_transactions;

CREATE POLICY "Users can view own wallet_transactions"
  ON wallet_transactions FOR SELECT
  USING (user_id = auth.uid());

-- Insert should be service-role only — edge functions handle this
-- If you have existing insert policies, review them:
-- CREATE POLICY "Service role can insert wallet_transactions"
--   ON wallet_transactions FOR INSERT
--   WITH CHECK (true); -- This is too loose, remove it

-- Index for fast wallet lookups
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user_default ON wallet_accounts(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON wallet_transactions(user_id, created_at DESC);
