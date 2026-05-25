-- MTAA Business Payments Schema
-- Run AFTER Phase 0 foundation tables exist

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('sole_proprietorship', 'llc', 'partnership', 'cooperative')),
  till_number text UNIQUE,
  paybill_number text UNIQUE,
  description text,
  category text,
  logo_url text,
  county text,
  sub_county text,
  ward text,
  location text,
  phone text,
  email text,
  kra_pin text,
  business_reg_number text,
  documents jsonb DEFAULT '[]',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
  rejection_reason text,
  fee_percentage numeric DEFAULT 1.5,
  settlement_frequency text DEFAULT 'daily' CHECK (settlement_frequency IN ('instant', 'daily', 'weekly', 'monthly')),
  settlement_threshold numeric DEFAULT 1000,
  bank_account jsonb,
  mpesa_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX idx_businesses_till ON public.businesses(till_number) WHERE till_number IS NOT NULL;
CREATE INDEX idx_businesses_paybill ON public.businesses(paybill_number) WHERE paybill_number IS NOT NULL;
CREATE INDEX idx_businesses_status ON public.businesses(status);
CREATE INDEX idx_businesses_county ON public.businesses(county);

CREATE TABLE IF NOT EXISTS public.till_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  till_number text NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  sender_phone text NOT NULL,
  sender_name text,
  sender_confirmed boolean DEFAULT false,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'KES',
  mpesa_receipt text,
  mpesa_transaction_id text,
  transaction_type text DEFAULT 'CustomerBuyGoodsOnline',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  failure_reason text,
  settled boolean DEFAULT false,
  settled_at timestamptz,
  settlement_amount numeric,
  settlement_fee numeric,
  callback_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_till_payments_till ON public.till_payments(till_number);
CREATE INDEX idx_till_payments_business ON public.till_payments(business_id);
CREATE INDEX idx_till_payments_sender ON public.till_payments(sender_phone);
CREATE INDEX idx_till_payments_status ON public.till_payments(status);
CREATE INDEX idx_till_payments_settled ON public.till_payments(settled) WHERE settled = false;
CREATE INDEX idx_till_payments_created ON public.till_payments(created_at DESC);

CREATE TABLE IF NOT EXISTS public.paybill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paybill_number text NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  account_number text NOT NULL,
  sender_phone text NOT NULL,
  sender_name text,
  sender_confirmed boolean DEFAULT false,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'KES',
  mpesa_receipt text,
  mpesa_transaction_id text,
  transaction_type text DEFAULT 'CustomerPayBillOnline',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  failure_reason text,
  settled boolean DEFAULT false,
  settled_at timestamptz,
  settlement_amount numeric,
  settlement_fee numeric,
  callback_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_paybill_payments_paybill ON public.paybill_payments(paybill_number);
CREATE INDEX idx_paybill_payments_business ON public.paybill_payments(business_id);
CREATE INDEX idx_paybill_payments_account ON public.paybill_payments(account_number);
CREATE INDEX idx_paybill_payments_status ON public.paybill_payments(status);
CREATE INDEX idx_paybill_payments_settled ON public.paybill_payments(settled) WHERE settled = false;
CREATE INDEX idx_paybill_payments_created ON public.paybill_payments(created_at DESC);

CREATE TABLE IF NOT EXISTS public.phone_registry (
  phone text PRIMARY KEY,
  name text NOT NULL,
  verified boolean DEFAULT false,
  source text DEFAULT 'user_provided' CHECK (source IN ('user_provided', 'mpesa_callback', 'kyc_verified', 'admin_set')),
  confidence_score numeric DEFAULT 0.8 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  usage_count integer DEFAULT 1
);

CREATE INDEX idx_phone_registry_name ON public.phone_registry(name);

CREATE TABLE IF NOT EXISTS public.business_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id),
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_business_audit_business ON public.business_audit_logs(business_id);
CREATE INDEX idx_business_audit_action ON public.business_audit_logs(action);
CREATE INDEX idx_business_audit_created ON public.business_audit_logs(created_at DESC);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.till_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paybill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view own business" ON public.businesses FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Business owners can update own business" ON public.businesses FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Admins can view all businesses" ON public.businesses FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Admins can update all businesses" ON public.businesses FOR UPDATE USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "Business owners can view own till payments" ON public.till_payments FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Edge functions can insert till payments" ON public.till_payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Business owners can view own paybill payments" ON public.paybill_payments FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Edge functions can insert paybill payments" ON public.paybill_payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read phone registry" ON public.phone_registry FOR SELECT USING (true);
CREATE POLICY "Edge functions can insert phone registry" ON public.phone_registry FOR INSERT WITH CHECK (true);

CREATE POLICY "Business owners can view own audit logs" ON public.business_audit_logs FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Admins can view all audit logs" ON public.business_audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER till_payments_updated_at BEFORE UPDATE ON public.till_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER paybill_payments_updated_at BEFORE UPDATE ON public.paybill_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.resolve_sender_name(p_phone text) RETURNS text AS $$
DECLARE v_name text;
BEGIN
  SELECT name INTO v_name FROM public.phone_registry WHERE phone = p_phone;
  IF v_name IS NOT NULL THEN
    UPDATE public.phone_registry SET usage_count = usage_count + 1, last_seen_at = now() WHERE phone = p_phone;
    RETURN v_name;
  END IF;
  SELECT raw_user_meta_data->>'full_name' INTO v_name FROM auth.users WHERE phone = p_phone;
  IF v_name IS NOT NULL THEN RETURN v_name; END IF;
  RETURN 'User ' || LEFT(p_phone, 4) || '****' || RIGHT(p_phone, 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.generate_till_number() RETURNS text AS $$
DECLARE v_number text; v_exists boolean;
BEGIN
  LOOP
    v_number := LPAD(floor(random() * 900000 + 100000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.businesses WHERE till_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_paybill_number() RETURNS text AS $$
DECLARE v_number text; v_exists boolean;
BEGIN
  LOOP
    v_number := LPAD(floor(random() * 900000 + 100000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.businesses WHERE paybill_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;
