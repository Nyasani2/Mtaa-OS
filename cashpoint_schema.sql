-- ============================================
-- MTAA CASHPOINT SYSTEM — Agent Network
-- Enables any user to become a withdrawal/deposit agent
-- ============================================

-- 1. CASHPOINT AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.cashpoint_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  agent_type text NOT NULL DEFAULT 'kiosk' CHECK (agent_type = ANY (ARRAY['kiosk'::text, 'mobile'::text, 'stationary'::text, 'shop'::text, 'mama_mboga'::text])),
  phone text,
  id_number text,
  kra_pin text,
  business_address text,
  location_lat numeric,
  location_lng numeric,
  region text,
  city text,
  status text NOT NULL DEFAULT 'pending_approval'::text CHECK (status = ANY (ARRAY['pending_approval'::text, 'under_review'::text, 'approved'::text, 'active'::text, 'suspended'::text, 'revoked'::text])),
  float_balance numeric NOT NULL DEFAULT 0,
  daily_transaction_limit numeric NOT NULL DEFAULT 500000,
  monthly_transaction_limit numeric NOT NULL DEFAULT 10000000,
  today_deposited numeric NOT NULL DEFAULT 0,
  today_withdrawn numeric NOT NULL DEFAULT 0,
  monthly_volume numeric NOT NULL DEFAULT 0,
  total_commission_earned numeric NOT NULL DEFAULT 0,
  today_commission numeric NOT NULL DEFAULT 0,
  monthly_commission numeric NOT NULL DEFAULT 0,
  qr_code_data text,
  agent_code text UNIQUE,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  activated_at timestamp with time zone,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cashpoint_agents_pkey PRIMARY KEY (id),
  CONSTRAINT cashpoint_agents_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_cashpoint_agents_user_id ON public.cashpoint_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_cashpoint_agents_status ON public.cashpoint_agents(status);
CREATE INDEX IF NOT EXISTS idx_cashpoint_agents_location ON public.cashpoint_agents(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_cashpoint_agents_agent_code ON public.cashpoint_agents(agent_code);

-- 2. COMMISSION RULES
CREATE TABLE IF NOT EXISTS public.cashpoint_commissions (
  id serial PRIMARY KEY,
  tx_type text NOT NULL CHECK (tx_type = ANY (ARRAY['withdrawal'::text, 'deposit'::text])),
  min_amount numeric NOT NULL DEFAULT 0,
  max_amount numeric,
  commission_rate numeric,
  commission_fixed numeric,
  commission_cap numeric,
  active boolean DEFAULT true,
  country text DEFAULT 'KE',
  created_at timestamp with time zone DEFAULT now()
);

INSERT INTO public.cashpoint_commissions (tx_type, min_amount, max_amount, commission_fixed, active) VALUES
  ('withdrawal', 50, 1000, 5, true),
  ('withdrawal', 1001, 2500, 10, true),
  ('withdrawal', 2501, 5000, 15, true),
  ('withdrawal', 5001, 10000, 20, true),
  ('withdrawal', 10001, NULL, NULL, true);

INSERT INTO public.cashpoint_commissions (tx_type, min_amount, max_amount, commission_rate, commission_cap, active) VALUES
  ('deposit', 0, NULL, 0.005, 50, true);

-- 3. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.cashpoint_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.cashpoint_agents(id),
  customer_id uuid REFERENCES auth.users(id),
  tx_type text NOT NULL CHECK (tx_type = ANY (ARRAY['withdrawal'::text, 'deposit'::text])),
  amount numeric NOT NULL CHECK (amount > 0),
  commission_amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  agent_net numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'reversed'::text])),
  wallet_transaction_id uuid,
  reference_code text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT cashpoint_transactions_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_cashpoint_tx_agent ON public.cashpoint_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_cashpoint_tx_customer ON public.cashpoint_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cashpoint_tx_status ON public.cashpoint_transactions(status);
CREATE INDEX IF NOT EXISTS idx_cashpoint_tx_created ON public.cashpoint_transactions(created_at DESC);

-- 4. FLOAT LOGS
CREATE TABLE IF NOT EXISTS public.cashpoint_float_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.cashpoint_agents(id),
  amount numeric NOT NULL,
  tx_type text NOT NULL CHECK (tx_type = ANY (ARRAY['topup'::text, 'withdrawal'::text, 'commission_credit'::text, 'adjustment'::text])),
  balance_after numeric NOT NULL,
  reference_tx_id uuid REFERENCES public.cashpoint_transactions(id),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cashpoint_float_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_float_logs_agent ON public.cashpoint_float_logs(agent_id);

-- 5. DAILY LIMITS
CREATE TABLE IF NOT EXISTS public.cashpoint_daily_limits (
  agent_id uuid NOT NULL REFERENCES public.cashpoint_agents(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  deposited_today numeric NOT NULL DEFAULT 0,
  withdrawn_today numeric NOT NULL DEFAULT 0,
  commission_today numeric NOT NULL DEFAULT 0,
  tx_count_today integer NOT NULL DEFAULT 0,
  CONSTRAINT cashpoint_daily_limits_pkey PRIMARY KEY (agent_id, date)
);

-- 6. RLS
ALTER TABLE public.cashpoint_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashpoint_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashpoint_float_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashpoint_daily_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cashpoint_agents_select_own ON public.cashpoint_agents;
CREATE POLICY cashpoint_agents_select_own ON public.cashpoint_agents FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS cashpoint_agents_insert_own ON public.cashpoint_agents;
CREATE POLICY cashpoint_agents_insert_own ON public.cashpoint_agents FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS cashpoint_agents_update_own ON public.cashpoint_agents;
CREATE POLICY cashpoint_agents_update_own ON public.cashpoint_agents FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS cashpoint_tx_select ON public.cashpoint_transactions;
CREATE POLICY cashpoint_tx_select ON public.cashpoint_transactions FOR SELECT USING (
  auth.uid() = customer_id OR EXISTS (SELECT 1 FROM public.cashpoint_agents WHERE id = agent_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS cashpoint_float_select_own ON public.cashpoint_float_logs;
CREATE POLICY cashpoint_float_select_own ON public.cashpoint_float_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cashpoint_agents WHERE id = agent_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS cashpoint_limits_select_own ON public.cashpoint_daily_limits;
CREATE POLICY cashpoint_limits_select_own ON public.cashpoint_daily_limits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cashpoint_agents WHERE id = agent_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS cashpoint_admin_all ON public.cashpoint_agents;
CREATE POLICY cashpoint_admin_all ON public.cashpoint_agents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 7. FUNCTIONS
CREATE OR REPLACE FUNCTION calculate_cashpoint_commission(p_amount numeric, p_tx_type text)
RETURNS numeric AS $$
DECLARE v_commission numeric := 0; v_rule record;
BEGIN
  SELECT * INTO v_rule FROM public.cashpoint_commissions
  WHERE tx_type = p_tx_type AND active = true
    AND (min_amount IS NULL OR p_amount >= min_amount)
    AND (max_amount IS NULL OR p_amount <= max_amount)
  ORDER BY min_amount DESC LIMIT 1;
  IF FOUND THEN
    IF v_rule.commission_fixed IS NOT NULL THEN v_commission := v_rule.commission_fixed;
    ELSIF v_rule.commission_rate IS NOT NULL THEN
      v_commission := p_amount * v_rule.commission_rate;
      IF v_rule.commission_cap IS NOT NULL AND v_commission > v_rule.commission_cap THEN
        v_commission := v_rule.commission_cap;
      END IF;
    END IF;
  END IF;
  RETURN v_commission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_cashpoint_withdrawal(p_agent_id uuid, p_customer_id uuid, p_amount numeric, p_reference_code text DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE v_agent public.cashpoint_agents%ROWTYPE; v_commission numeric; v_tx_id uuid;
BEGIN
  SELECT * INTO v_agent FROM public.cashpoint_agents WHERE id = p_agent_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Agent not found'); END IF;
  IF v_agent.status != 'active' THEN RETURN jsonb_build_object('success', false, 'error', 'Agent not active'); END IF;
  IF v_agent.today_withdrawn + p_amount > v_agent.daily_transaction_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily limit exceeded'); END IF;
  v_commission := calculate_cashpoint_commission(p_amount, 'withdrawal');
  INSERT INTO public.cashpoint_transactions (agent_id, customer_id, tx_type, amount, commission_amount, platform_fee, agent_net, status, reference_code)
  VALUES (p_agent_id, p_customer_id, 'withdrawal', p_amount, v_commission, 0, p_amount + v_commission, 'completed', p_reference_code)
  RETURNING id INTO v_tx_id;
  UPDATE public.cashpoint_agents SET today_withdrawn = today_withdrawn + p_amount, monthly_volume = monthly_volume + p_amount,
    total_commission_earned = total_commission_earned + v_commission, today_commission = today_commission + v_commission,
    monthly_commission = monthly_commission + v_commission, float_balance = float_balance - p_amount, updated_at = now()
  WHERE id = p_agent_id;
  INSERT INTO public.cashpoint_float_logs (agent_id, amount, tx_type, balance_after, reference_tx_id, notes)
  VALUES (p_agent_id, -p_amount, 'withdrawal', v_agent.float_balance - p_amount, v_tx_id, 'Customer withdrawal');
  RETURN jsonb_build_object('success', true, 'tx_id', v_tx_id, 'commission', v_commission);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_cashpoint_deposit(p_agent_id uuid, p_customer_id uuid, p_amount numeric, p_reference_code text DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE v_agent public.cashpoint_agents%ROWTYPE; v_commission numeric; v_tx_id uuid;
BEGIN
  SELECT * INTO v_agent FROM public.cashpoint_agents WHERE id = p_agent_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Agent not found'); END IF;
  IF v_agent.status != 'active' THEN RETURN jsonb_build_object('success', false, 'error', 'Agent not active'); END IF;
  IF v_agent.today_deposited + p_amount > v_agent.daily_transaction_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily limit exceeded'); END IF;
  v_commission := calculate_cashpoint_commission(p_amount, 'deposit');
  INSERT INTO public.cashpoint_transactions (agent_id, customer_id, tx_type, amount, commission_amount, platform_fee, agent_net, status, reference_code)
  VALUES (p_agent_id, p_customer_id, 'deposit', p_amount, v_commission, 0, p_amount - v_commission, 'completed', p_reference_code)
  RETURNING id INTO v_tx_id;
  UPDATE public.cashpoint_agents SET today_deposited = today_deposited + p_amount, monthly_volume = monthly_volume + p_amount,
    total_commission_earned = total_commission_earned + v_commission, today_commission = today_commission + v_commission,
    monthly_commission = monthly_commission + v_commission, float_balance = float_balance + p_amount, updated_at = now()
  WHERE id = p_agent_id;
  INSERT INTO public.cashpoint_float_logs (agent_id, amount, tx_type, balance_after, reference_tx_id, notes)
  VALUES (p_agent_id, p_amount, 'deposit', v_agent.float_balance + p_amount, v_tx_id, 'Customer deposit');
  RETURN jsonb_build_object('success', true, 'tx_id', v_tx_id, 'commission', v_commission);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_cashpoint_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.cashpoint_agents SET today_deposited = 0, today_withdrawn = 0, today_commission = 0, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_cashpoint_agents_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cashpoint_agents_updated_at ON public.cashpoint_agents;
CREATE TRIGGER cashpoint_agents_updated_at BEFORE UPDATE ON public.cashpoint_agents FOR EACH ROW EXECUTE FUNCTION update_cashpoint_agents_updated_at();
