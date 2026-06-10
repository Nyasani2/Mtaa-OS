
-- ============================================================
-- MTAA AFRIQ — BINANCE BRIDGE MODULE
-- Fiat-to-crypto onramp via MTAA Wallet
-- NOT a Binance host — just a bridge
-- ============================================================

-- ============================================================
-- CORE TABLES
-- ============================================================

-- binance_bridge_config: System configuration
CREATE TABLE IF NOT EXISTS public.binance_bridge_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- API endpoints (stored encrypted in production)
  binance_api_base text DEFAULT 'https://api.binance.com',
  binance_pay_base text DEFAULT 'https://bpay.binanceapi.com',

  -- Conversion settings
  default_from_currency text DEFAULT 'KES',
  default_to_currency text DEFAULT 'USDT',

  -- Limits
  min_conversion_kes numeric DEFAULT 100,
  max_conversion_kes numeric DEFAULT 1000000,
  daily_limit_kes numeric DEFAULT 500000,

  -- Fees
  conversion_fee_percent numeric DEFAULT 1.5,
  network_fee_usdt numeric DEFAULT 1.0,

  -- Status
  is_active boolean DEFAULT true,
  maintenance_mode boolean DEFAULT false,
  maintenance_message text,

  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- binance_conversions: User conversion records
CREATE TABLE IF NOT EXISTS public.binance_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source (from MTAA Wallet)
  wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL,
  from_currency text NOT NULL DEFAULT 'KES',
  from_amount numeric NOT NULL,

  -- Conversion details
  exchange_rate numeric NOT NULL, -- KES per USDT at time of conversion
  to_currency text NOT NULL DEFAULT 'USDT',
  to_amount numeric NOT NULL, -- After fees

  -- Fees
  conversion_fee numeric DEFAULT 0,
  network_fee numeric DEFAULT 0,
  total_fees numeric DEFAULT 0,

  -- Destination (to Binance)
  binance_email text, -- User's Binance account email
  binance_user_id text, -- Binance internal user ID if linked
  destination_address text, -- USDT deposit address
  destination_network text DEFAULT 'TRC20' CHECK (destination_network = ANY (ARRAY['TRC20'::text, 'ERC20'::text, 'BEP20'::text, 'SOL'::text])),

  -- Status flow
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'rate_locked'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),

  -- Timestamps
  rate_locked_at timestamptz,
  processed_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,

  -- External tracking
  binance_order_id text,
  binance_tx_hash text,
  blockchain_tx_hash text,

  -- Metadata
  ip_address text,
  user_agent text,
  meta_data jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- binance_user_links: Linked Binance accounts
CREATE TABLE IF NOT EXISTS public.binance_user_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Binance credentials (encrypted)
  binance_email text,
  binance_api_key_encrypted text,
  binance_api_secret_encrypted text,

  -- Verification
  is_verified boolean DEFAULT false,
  verified_at timestamptz,

  -- Preferences
  default_network text DEFAULT 'TRC20',
  auto_convert boolean DEFAULT false,
  auto_convert_threshold numeric DEFAULT 1000, -- Auto-convert when wallet > 1000 KES

  -- Status
  is_active boolean DEFAULT true,
  last_used_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (user_id)
);

-- binance_rate_history: Exchange rate tracking
CREATE TABLE IF NOT EXISTS public.binance_rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric NOT NULL,
  source text DEFAULT 'binance_p2p',
  recorded_at timestamptz DEFAULT now()
);

-- binance_limits: Per-user daily/monthly limits
CREATE TABLE IF NOT EXISTS public.binance_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  daily_converted_kes numeric DEFAULT 0,
  daily_limit_kes numeric DEFAULT 500000,
  monthly_converted_kes numeric DEFAULT 0,
  monthly_limit_kes numeric DEFAULT 5000000,

  last_reset_daily timestamptz DEFAULT now(),
  last_reset_monthly timestamptz DEFAULT now(),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (user_id)
);

-- binance_webhooks: Incoming webhooks from Binance
CREATE TABLE IF NOT EXISTS public.binance_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  event_type text NOT NULL,
  payload jsonb NOT NULL,

  processed boolean DEFAULT false,
  processed_at timestamptz,

  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_binance_conv_user ON public.binance_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_binance_conv_status ON public.binance_conversions(status);
CREATE INDEX IF NOT EXISTS idx_binance_conv_created ON public.binance_conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_binance_conv_wallet ON public.binance_conversions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_binance_link_user ON public.binance_user_links(user_id);
CREATE INDEX IF NOT EXISTS idx_binance_link_active ON public.binance_user_links(is_active);

CREATE INDEX IF NOT EXISTS idx_binance_rate_pair ON public.binance_rate_history(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_binance_rate_time ON public.binance_rate_history(recorded_at);

CREATE INDEX IF NOT EXISTS idx_binance_limits_user ON public.binance_limits(user_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.binance_bridge_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binance_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binance_user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binance_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binance_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binance_webhooks ENABLE ROW LEVEL SECURITY;

-- Config: viewable by all, manageable by admin only
CREATE POLICY "Config viewable" ON public.binance_bridge_config FOR SELECT USING (true);
CREATE POLICY "Config admin only" ON public.binance_bridge_config FOR ALL USING (false);

-- Conversions: viewable by owner
CREATE POLICY "Conversions viewable by user" ON public.binance_conversions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Conversions insertable by user" ON public.binance_conversions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Conversions updatable by system" ON public.binance_conversions
  FOR UPDATE USING (user_id = auth.uid());

-- User links: viewable/manageable by owner
CREATE POLICY "Links viewable by owner" ON public.binance_user_links
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Links manageable by owner" ON public.binance_user_links
  FOR ALL USING (user_id = auth.uid());

-- Rate history: viewable by all
CREATE POLICY "Rates viewable" ON public.binance_rate_history FOR SELECT USING (true);

-- Limits: viewable by owner
CREATE POLICY "Limits viewable by user" ON public.binance_limits
  FOR SELECT USING (user_id = auth.uid());

-- Webhooks: system only
CREATE POLICY "Webhooks system" ON public.binance_webhooks FOR ALL USING (false);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_binance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['binance_conversions', 'binance_user_links', 'binance_limits'];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.update_binance_updated_at()', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- REALTIME
-- ============================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.binance_conversions;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================================
-- SEED
-- ============================================================

INSERT INTO public.binance_bridge_config (is_active)
VALUES (true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
