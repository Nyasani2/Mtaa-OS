-- MTAA LIVE STREAMING MIGRATION
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_type TEXT DEFAULT 'tribes',
  module_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  audience_type TEXT DEFAULT 'public',
  ticket_price INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  livekit_room_name TEXT UNIQUE,
  peak_viewers INTEGER DEFAULT 0,
  total_tips INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS livekit_room_name TEXT;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS total_tips INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS live_stream_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_moderator BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS live_stream_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_tips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all streams" ON live_streams;
DROP POLICY IF EXISTS "Users can create streams" ON live_streams;
DROP POLICY IF EXISTS "Creators can update their streams" ON live_streams;
DROP POLICY IF EXISTS "Users can view messages" ON live_stream_messages;
DROP POLICY IF EXISTS "Users can send messages" ON live_stream_messages;
DROP POLICY IF EXISTS "Users can view tips" ON live_stream_tips;
DROP POLICY IF EXISTS "Users can send tips" ON live_stream_tips;

-- DROP POLICY IF EXISTS "Users can view all streams" ON live_streams;
CREATE POLICY "Users can view all streams" ON live_streams FOR SELECT USING (true);  -- Commented out: table already exists with different schema
-- DROP POLICY IF EXISTS "Users can create streams" ON live_streams;
CREATE POLICY "Users can create streams" ON live_streams FOR INSERT WITH CHECK (auth.uid() = host_id);  -- Commented out: table already exists with different schema
-- DROP POLICY IF EXISTS "Creators can update their streams" ON live_streams;
CREATE POLICY "Creators can update their streams" ON live_streams FOR UPDATE USING (auth.uid() = host_id);  -- Commented out: table already exists with different schema
-- DROP POLICY IF EXISTS "Users can view messages" ON live_stream_messages;
CREATE POLICY "Users can view messages" ON live_stream_messages FOR SELECT USING (true);
-- DROP POLICY IF EXISTS "Users can send messages" ON live_stream_messages;
CREATE POLICY "Users can send messages" ON live_stream_messages FOR INSERT WITH CHECK (auth.uid() = host_id);
-- DROP POLICY IF EXISTS "Users can view tips" ON live_stream_tips;
CREATE POLICY "Users can view tips" ON live_stream_tips FOR SELECT USING (true);
-- DROP POLICY IF EXISTS "Users can send tips" ON live_stream_tips;
CREATE POLICY "Users can send tips" ON live_stream_tips FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_creator ON live_streams(host_id);
CREATE INDEX IF NOT EXISTS idx_live_messages_stream ON live_stream_messages(stream_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_tips_stream ON live_stream_tips(stream_id, created_at DESC);

CREATE OR REPLACE FUNCTION send_live_stream_tip(
  p_stream_id UUID, p_sender_id UUID, p_receiver_id UUID, p_amount INTEGER, p_message TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_sender_wallet_id UUID; v_receiver_wallet_id UUID; v_sender_balance NUMERIC; v_transaction_id UUID;
BEGIN
  SELECT id INTO v_sender_wallet_id FROM wallets WHERE user_id = p_sender_id LIMIT 1;
  SELECT id INTO v_receiver_wallet_id FROM wallets WHERE user_id = p_receiver_id LIMIT 1;
  IF v_sender_wallet_id IS NULL OR v_receiver_wallet_id IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  SELECT available_balance INTO v_sender_balance FROM wallets WHERE id = v_sender_wallet_id FOR UPDATE;
  IF v_sender_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  v_transaction_id := gen_random_uuid();
  INSERT INTO wallet_transactions (id, user_id, wallet_id, type, amount, currency, status, description, reference_type, reference_id)
  VALUES (v_transaction_id, p_sender_id, v_sender_wallet_id, 'live_tip', p_amount, 'KES', 'completed', 'Live stream tip', 'stream', p_stream_id);
  UPDATE wallets SET available_balance = available_balance - p_amount, balance = balance - p_amount WHERE id = v_sender_wallet_id;
  INSERT INTO wallet_ledger (wallet_id, transaction_id, entry_type, debit_amount, credit_amount, balance_after)
  VALUES (v_sender_wallet_id, v_transaction_id, 'debit', p_amount, 0, (SELECT available_balance FROM wallets WHERE id = v_sender_wallet_id));
  UPDATE wallets SET available_balance = available_balance + p_amount, balance = balance + p_amount WHERE id = v_receiver_wallet_id;
  INSERT INTO wallet_ledger (wallet_id, transaction_id, entry_type, debit_amount, credit_amount, balance_after)
  VALUES (v_receiver_wallet_id, v_transaction_id, 'credit', 0, p_amount, (SELECT available_balance FROM wallets WHERE id = v_receiver_wallet_id));
  INSERT INTO live_stream_tips (stream_id, sender_id, recipient_id, amount, message) VALUES (p_stream_id, p_sender_id, p_receiver_id, p_amount, p_message);
  UPDATE live_streams SET total_tips = total_tips + p_amount WHERE id = p_stream_id;
  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END; $$;

-- GRANT EXECUTE ON FUNCTION send_live_stream_tip TO authenticated; -- Commented: ambiguous due to function overloading
