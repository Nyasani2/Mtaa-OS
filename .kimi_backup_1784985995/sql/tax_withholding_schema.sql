-- ============================================
-- TAX WITHHOLDING TABLE
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS tax_withholdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'mtaxi_ride', 'mtruck_delivery', 'boda_ride',
    'shop_sale', 'restaurant_order', 'creator_earning'
  )),
  taxpayer_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  base_amount NUMERIC(15,2) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  tax_rate NUMERIC(5,4) NOT NULL,
  currency TEXT NOT NULL,
  jurisdiction_code TEXT NOT NULL,
  authority_wallet_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'remitted', 'refunded')),
  remitted_at TIMESTAMPTZ,
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_withholdings_taxpayer ON tax_withholdings(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_tax_withholdings_jurisdiction ON tax_withholdings(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_tax_withholdings_status ON tax_withholdings(status);
CREATE INDEX IF NOT EXISTS idx_tax_withholdings_transaction ON tax_withholdings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tax_withholdings_created ON tax_withholdings(created_at);

-- Enable RLS
ALTER TABLE tax_withholdings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tax_withholdings_select_own"
  ON tax_withholdings FOR SELECT
  USING (taxpayer_id = auth.uid());

CREATE POLICY "tax_withholdings_select_officer"
  ON tax_withholdings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (role = 'regulatory_officer' OR role = 'admin' OR role = 'super_admin')
  ));

CREATE POLICY "tax_withholdings_insert_system"
  ON tax_withholdings FOR INSERT
  WITH CHECK (true); -- Inserted by edge functions / RPC only

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_tax_withholdings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tax_withholdings_updated_at ON tax_withholdings;
CREATE TRIGGER trg_tax_withholdings_updated_at
  BEFORE UPDATE ON tax_withholdings
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_withholdings_updated_at();

-- Add jurisdiction_code to existing regulatory tables
ALTER TABLE regulatory_tax_payments ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT DEFAULT 'KE';
ALTER TABLE regulatory_tax_revenue ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT DEFAULT 'KE';
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT DEFAULT 'KE';
ALTER TABLE tax_liabilities ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT DEFAULT 'KE';
ALTER TABLE regulatory_compliance ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT DEFAULT 'KE';

-- Create indexes on new columns
CREATE INDEX IF NOT EXISTS idx_tax_payments_jurisdiction ON regulatory_tax_payments(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_tax_revenue_jurisdiction ON regulatory_tax_revenue(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_tax_records_jurisdiction ON tax_records(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_tax_liabilities_jurisdiction ON tax_liabilities(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_jurisdiction ON regulatory_compliance(jurisdiction_code);
