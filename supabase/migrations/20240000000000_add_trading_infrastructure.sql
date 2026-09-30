-- 1. Treasury Ledger (Tracks MTAA's internal fiat/crypto reserves)
CREATE TABLE IF NOT EXISTS treasury_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency TEXT NOT NULL,
  balance DECIMAL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Trading Balances (Internal MTAA USD/Crypto balance)
CREATE TABLE IF NOT EXISTS trading_ledgers (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance DECIMAL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, currency)
);

-- 3. Transaction Audit Log
CREATE TABLE IF NOT EXISTS treasury_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'trade_fee', 'treasury_transfer')),
  mtaa_amount DECIMAL,
  usd_amount DECIMAL,
  exchange_rate DECIMAL,
  fee_amount DECIMAL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Encrypted User Exchange Accounts (Binance/Deriv)
CREATE TABLE IF NOT EXISTS user_exchange_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange TEXT CHECK (exchange IN ('binance', 'deriv')),
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT,
  permissions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exchange)
);

-- Enable RLS (Row Level Security)
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exchange_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON treasury_transactions;
CREATE POLICY "Users can view own transactions" ON treasury_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own exchange accounts" ON user_exchange_accounts;
CREATE POLICY "Users can view own exchange accounts" ON user_exchange_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Note: treasury_ledger and trading_ledgers should ONLY be modified via secure Supabase Edge Functions or RPCs, not direct client access.
