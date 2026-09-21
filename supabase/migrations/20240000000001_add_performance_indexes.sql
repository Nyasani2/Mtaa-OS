-- Add indexes to frequently queried fields to speed up ASIS and Wallet
CREATE INDEX IF NOT EXISTS idx_asis_messages_session ON asis_chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user ON wallet_accounts(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_user ON treasury_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_accounts_user ON user_exchange_accounts(user_id, exchange);
