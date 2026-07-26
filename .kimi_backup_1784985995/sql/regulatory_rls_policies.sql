-- ============================================
-- REGULATORY MODULE RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all regulatory tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE tax_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_tax_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_tax_payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE compliance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_compliance ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbk_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_reports ENABLE ROW LEVEL SECURITY;

-- Drop any existing open policies
DROP POLICY IF EXISTS "regulatory_read_all" ON businesses;
DROP POLICY IF EXISTS "regulatory_read_all" ON tax_records;
DROP POLICY IF EXISTS "regulatory_read_all" ON compliance_reviews;

-- Helper function to check if user is regulatory officer or admin
CREATE OR REPLACE FUNCTION is_regulatory_officer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (role = 'regulatory_officer' OR role = 'admin' OR role = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user owns a business
CREATE OR REPLACE FUNCTION is_business_owner(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM business_owners
    WHERE business_id = $1 AND user_id = auth.uid() AND is_primary = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BUSINESSES
-- ============================================
CREATE POLICY "businesses_select_regulatory"
  ON businesses FOR SELECT
  USING (is_regulatory_officer() OR EXISTS (
    SELECT 1 FROM business_owners WHERE business_id = businesses.id AND user_id = auth.uid()
  ));

CREATE POLICY "businesses_insert_regulatory"
  ON businesses FOR INSERT
  WITH CHECK (is_regulatory_officer() OR auth.uid() IS NOT NULL);

CREATE POLICY "businesses_update_regulatory"
  ON businesses FOR UPDATE
  USING (is_regulatory_officer() OR is_business_owner(id));

-- ============================================
-- BUSINESS PROFILES
-- ============================================
CREATE POLICY "business_profiles_select_regulatory"
  ON business_profiles FOR SELECT
  USING (is_regulatory_officer() OR is_business_owner(business_id));

CREATE POLICY "business_profiles_insert_regulatory"
  ON business_profiles FOR INSERT
  WITH CHECK (is_regulatory_officer() OR is_business_owner(business_id));

CREATE POLICY "business_profiles_update_regulatory"
  ON business_profiles FOR UPDATE
  USING (is_regulatory_officer() OR is_business_owner(business_id));

-- ============================================
-- BUSINESS OWNERS
-- ============================================
CREATE POLICY "business_owners_select_regulatory"
  ON business_owners FOR SELECT
  USING (is_regulatory_officer() OR user_id = auth.uid());

CREATE POLICY "business_owners_insert_regulatory"
  ON business_owners FOR INSERT
  WITH CHECK (is_regulatory_officer() OR is_business_owner(business_id));

-- ============================================
-- TAX RECORDS
-- ============================================
CREATE POLICY "tax_records_select_regulatory"
  ON tax_records FOR SELECT
  USING (is_regulatory_officer() OR taxpayer_id = auth.uid());

CREATE POLICY "tax_records_insert_regulatory"
  ON tax_records FOR INSERT
  WITH CHECK (is_regulatory_officer());

-- ============================================
-- TAX LIABILITIES
-- ============================================
CREATE POLICY "tax_liabilities_select_regulatory"
  ON tax_liabilities FOR SELECT
  USING (is_regulatory_officer() OR taxpayer_id = auth.uid());

CREATE POLICY "tax_liabilities_insert_regulatory"
  ON tax_liabilities FOR INSERT
  WITH CHECK (is_regulatory_officer());

-- ============================================
-- TAX PAYMENTS
-- ============================================
CREATE POLICY "tax_payments_select_regulatory"
  ON regulatory_tax_payments FOR SELECT
  USING (is_regulatory_officer() OR taxpayer_id = auth.uid());

CREATE POLICY "tax_payments_insert_regulatory"
  ON regulatory_tax_payments FOR INSERT
  WITH CHECK (taxpayer_id = auth.uid() OR is_regulatory_officer());

-- ============================================
-- TAX REVENUE
-- ============================================
CREATE POLICY "tax_revenue_select_regulatory"
  ON regulatory_tax_revenue FOR SELECT
  USING (is_regulatory_officer());

CREATE POLICY "tax_revenue_insert_regulatory"
  ON regulatory_tax_revenue FOR INSERT
  WITH CHECK (is_regulatory_officer());

-- ============================================
-- COMPLIANCE REVIEWS
-- ============================================
CREATE POLICY "compliance_reviews_select_regulatory"
  ON compliance_reviews FOR SELECT
  USING (is_regulatory_officer() OR business_id IN (
    SELECT business_id FROM business_owners WHERE user_id = auth.uid()
  ));

CREATE POLICY "compliance_reviews_insert_regulatory"
  ON compliance_reviews FOR INSERT
  WITH CHECK (is_regulatory_officer());

CREATE POLICY "compliance_reviews_update_regulatory"
  ON compliance_reviews FOR UPDATE
  USING (is_regulatory_officer());

-- ============================================
-- COMPLIANCE CHECKS
-- ============================================
CREATE POLICY "compliance_checks_select_regulatory"
  ON compliance_checks FOR SELECT
  USING (is_regulatory_officer() OR business_id IN (
    SELECT business_id FROM business_owners WHERE user_id = auth.uid()
  ));

CREATE POLICY "compliance_checks_insert_regulatory"
  ON compliance_checks FOR INSERT
  WITH CHECK (is_regulatory_officer());

-- ============================================
-- COMPLIANCE RULES
-- ============================================
CREATE POLICY "compliance_rules_select_regulatory"
  ON compliance_rules FOR SELECT
  USING (true);

CREATE POLICY "compliance_rules_insert_regulatory"
  ON compliance_rules FOR INSERT
  WITH CHECK (is_regulatory_officer());

-- ============================================
-- REGULATORY COMPLIANCE
-- ============================================
CREATE POLICY "regulatory_compliance_select_regulatory"
  ON regulatory_compliance FOR SELECT
  USING (is_regulatory_officer() OR business_id IN (
    SELECT business_id FROM business_owners WHERE user_id = auth.uid()
  ));

CREATE POLICY "regulatory_compliance_insert_regulatory"
  ON regulatory_compliance FOR INSERT
  WITH CHECK (is_regulatory_officer());

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE POLICY "audit_logs_select_regulatory"
  ON audit_logs FOR SELECT
  USING (is_regulatory_officer());

CREATE POLICY "audit_logs_insert_regulatory"
  ON audit_logs FOR INSERT
  WITH CHECK (is_regulatory_officer() OR performed_by = auth.uid());

-- ============================================
-- REGULATORY FLAGS
-- ============================================
CREATE POLICY "regulatory_flags_select_regulatory"
  ON regulatory_flags FOR SELECT
  USING (is_regulatory_officer());

CREATE POLICY "regulatory_flags_insert_regulatory"
  ON regulatory_flags FOR INSERT
  WITH CHECK (is_regulatory_officer());

CREATE POLICY "regulatory_flags_update_regulatory"
  ON regulatory_flags FOR UPDATE
  USING (is_regulatory_officer());

-- ============================================
-- CBK REPORTS
-- ============================================
CREATE POLICY "cbk_reports_select_regulatory"
  ON cbk_reports FOR SELECT
  USING (is_regulatory_officer());

CREATE POLICY "cbk_reports_insert_regulatory"
  ON cbk_reports FOR INSERT
  WITH CHECK (is_regulatory_officer());

-- ============================================
-- REGULATORY REPORTS
-- ============================================
CREATE POLICY "regulatory_reports_select_regulatory"
  ON regulatory_reports FOR SELECT
  USING (is_regulatory_officer());

CREATE POLICY "regulatory_reports_insert_regulatory"
  ON regulatory_reports FOR INSERT
  WITH CHECK (is_regulatory_officer());

-- ============================================
-- BUSINESS TRANSACTIONS
-- ============================================
CREATE POLICY "business_transactions_select_regulatory"
  ON business_transactions FOR SELECT
  USING (is_regulatory_officer() OR business_id IN (
    SELECT business_id FROM business_owners WHERE user_id = auth.uid()
  ));
