-- Table to prevent double-scanning of the same QR code
CREATE TABLE IF NOT EXISTS qr_idempotency_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  merchant_id UUID REFERENCES auth.users(id),
  amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for fast nonce lookups
CREATE INDEX IF NOT EXISTS idx_qr_idempotency_nonce ON qr_idempotency_keys(nonce);

-- Function to clean up expired keys (can be run via cron or on-demand)
CREATE OR REPLACE FUNCTION cleanup_expired_qr_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM qr_idempotency_keys 
  WHERE expires_at < NOW() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;
