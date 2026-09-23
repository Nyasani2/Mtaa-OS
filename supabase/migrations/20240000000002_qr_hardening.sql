-- 1. Idempotency table to prevent double-scans
CREATE TABLE IF NOT EXISTS qr_idempotency_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  merchant_id UUID REFERENCES auth.users(id),
  amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_qr_idempotency_nonce ON qr_idempotency_keys(nonce);

-- 2. Performance indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_asis_messages_session ON asis_chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user ON wallet_accounts(user_id, is_default);
