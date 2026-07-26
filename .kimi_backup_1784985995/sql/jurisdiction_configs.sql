-- ============================================
-- JURISDICTION CONFIG TABLE
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS jurisdiction_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  flag TEXT,
  currency TEXT NOT NULL,
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.05,
  authority_name TEXT NOT NULL,
  authority_wallet_id TEXT NOT NULL,
  authority_code TEXT NOT NULL,
  vat_rate NUMERIC(5,4) DEFAULT 0.16,
  income_tax_brackets JSONB DEFAULT '[]',
  filing_frequency TEXT DEFAULT 'monthly' CHECK (filing_frequency IN ('monthly', 'quarterly', 'annual')),
  registration_required BOOLEAN DEFAULT true,
  supported_transaction_types JSONB DEFAULT '["mtaxi_ride","mtruck_delivery","boda_ride","shop_sale","restaurant_order","creator_earning"]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default jurisdictions
INSERT INTO jurisdiction_configs (code, name, flag, currency, tax_rate, authority_name, authority_wallet_id, authority_code, vat_rate, income_tax_brackets, filing_frequency, registration_required, supported_transaction_types)
VALUES
  ('KE', 'Kenya', '🇰🇪', 'KES', 0.05, 'Kenya Revenue Authority', 'wallet_kra_001', 'KRA', 0.16,
   '[{"min":0,"max":288000,"rate":0.10},{"min":288001,"max":388000,"rate":0.25},{"min":388001,"max":6000000,"rate":0.30},{"min":6000001,"max":9600000,"rate":0.325},{"min":9600001,"max":null,"rate":0.35}]',
   'monthly', true, '["mtaxi_ride","mtruck_delivery","boda_ride","shop_sale","restaurant_order","creator_earning"]'),
  ('UG', 'Uganda', '🇺🇬', 'UGX', 0.06, 'Uganda Revenue Authority', 'wallet_ura_001', 'URA', 0.18,
   '[{"min":0,"max":2820000,"rate":0.0},{"min":2820001,"max":4020000,"rate":0.10},{"min":4020001,"max":4920000,"rate":0.20},{"min":4920001,"max":10200000,"rate":0.30},{"min":10200001,"max":null,"rate":0.40}]',
   'monthly', true, '["mtaxi_ride","mtruck_delivery","boda_ride","shop_sale","restaurant_order"]'),
  ('TZ', 'Tanzania', '🇹🇿', 'TZS', 0.05, 'Tanzania Revenue Authority', 'wallet_tra_001', 'TRA', 0.18,
   '[{"min":0,"max":270000,"rate":0.0},{"min":270001,"max":520000,"rate":0.08},{"min":520001,"max":760000,"rate":0.20},{"min":760001,"max":1000000,"rate":0.25},{"min":1000001,"max":null,"rate":0.30}]',
   'monthly', true, '["mtaxi_ride","mtruck_delivery","boda_ride","shop_sale"]'),
  ('RW', 'Rwanda', '🇷🇼', 'RWF', 0.05, 'Rwanda Revenue Authority', 'wallet_rra_001', 'RRA', 0.18,
   '[{"min":0,"max":60000,"rate":0.0},{"min":60001,"max":100000,"rate":0.20},{"min":100001,"max":200000,"rate":0.30},{"min":200001,"max":null,"rate":0.40}]',
   'monthly', true, '["mtaxi_ride","mtruck_delivery","shop_sale"]'),
  ('NG', 'Nigeria', '🇳🇬', 'NGN', 0.05, 'Federal Inland Revenue Service', 'wallet_firs_001', 'FIRS', 0.075,
   '[{"min":0,"max":300000,"rate":0.07},{"min":300001,"max":600000,"rate":0.11},{"min":600001,"max":1100000,"rate":0.15},{"min":1100001,"max":1600000,"rate":0.19},{"min":1600001,"max":3200000,"rate":0.21},{"min":3200001,"max":null,"rate":0.24}]',
   'monthly', true, '["mtaxi_ride","mtruck_delivery","boda_ride","shop_sale","restaurant_order","creator_earning"]'),
  ('GH', 'Ghana', '🇬🇭', 'GHS', 0.05, 'Ghana Revenue Authority', 'wallet_gra_001', 'GRA', 0.15,
   '[{"min":0,"max":490,"rate":0.0},{"min":491,"max":600,"rate":0.05},{"min":601,"max":730,"rate":0.10},{"min":731,"max":3896,"rate":0.175},{"min":3897,"max":19896,"rate":0.25},{"min":19897,"max":50416,"rate":0.30},{"min":50417,"max":null,"rate":0.35}]',
   'monthly', true, '["mtaxi_ride","mtruck_delivery","shop_sale","restaurant_order"]'),
  ('ZA', 'South Africa', '🇿🇦', 'ZAR', 0.075, 'South African Revenue Service', 'wallet_sars_001', 'SARS', 0.15,
   '[{"min":0,"max":237100,"rate":0.18},{"min":237101,"max":370500,"rate":0.26},{"min":370501,"max":512800,"rate":0.31},{"min":512801,"max":673000,"rate":0.36},{"min":673001,"max":857900,"rate":0.39},{"min":857901,"max":1817000,"rate":0.41},{"min":1817001,"max":null,"rate":0.45}]',
   'monthly', true, '["mtaxi_ride","mtruck_delivery","shop_sale","restaurant_order","creator_earning"]'),
  ('ET', 'Ethiopia', '🇪🇹', 'ETB', 0.02, 'Ethiopian Revenue and Customs Authority', 'wallet_erca_001', 'ERCA', 0.15,
   '[{"min":0,"max":600,"rate":0.0},{"min":601,"max":1650,"rate":0.10},{"min":1651,"max":3200,"rate":0.15},{"min":3201,"max":5250,"rate":0.20},{"min":5251,"max":7800,"rate":0.25},{"min":7801,"max":10900,"rate":0.30},{"min":10901,"max":null,"rate":0.35}]',
   'monthly', true, '["mtaxi_ride","boda_ride","shop_sale"]')
ON CONFLICT (code) DO UPDATE SET
  tax_rate = EXCLUDED.tax_rate,
  vat_rate = EXCLUDED.vat_rate,
  income_tax_brackets = EXCLUDED.income_tax_brackets,
  updated_at = NOW();

-- Enable RLS
ALTER TABLE jurisdiction_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jurisdiction_configs_select_all"
  ON jurisdiction_configs FOR SELECT
  USING (active = true);

CREATE POLICY "jurisdiction_configs_admin"
  ON jurisdiction_configs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR role = 'super_admin')
  ));

-- Trigger
CREATE OR REPLACE FUNCTION update_jurisdiction_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jurisdiction_configs_updated ON jurisdiction_configs;
CREATE TRIGGER trg_jurisdiction_configs_updated
  BEFORE UPDATE ON jurisdiction_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_jurisdiction_configs_updated_at();
