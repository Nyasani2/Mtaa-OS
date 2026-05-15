
-- MTAA AFRIQ — Revenue Authority Engine (Country-Agnostic)
-- Supports: KRA (KE), URA (UG), GRA (GH), FIRS (NG), SARS (ZA), etc.
-- Every table has country_code for multi-tenant isolation

-- Taxpayer Registry
CREATE TABLE IF NOT EXISTS revenue_taxpayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    taxpayer_id TEXT NOT NULL UNIQUE,
    taxpayer_id_type TEXT NOT NULL DEFAULT 'pin',
    tax_type_status JSONB DEFAULT '{"income": "active", "vat": "inactive", "corporate": "inactive", "import": "inactive", "excise": "inactive", "property": "inactive"}',
    business_name TEXT,
    trading_name TEXT,
    business_type TEXT,
    registration_number TEXT,
    kyc_level TEXT DEFAULT 'pending',
    kyc_verified_at TIMESTAMPTZ,
    tax_region TEXT,
    tax_station TEXT,
    industry_sector TEXT,
    annual_turnover DECIMAL(15,2),
    employee_count INTEGER,
    contact_email TEXT,
    contact_phone TEXT,
    physical_address TEXT,
    postal_address TEXT,
    digital_address TEXT,
    compliance_score INTEGER DEFAULT 100,
    penalty_balance DECIMAL(15,2) DEFAULT 0,
    refund_balance DECIMAL(15,2) DEFAULT 0,
    account_status TEXT DEFAULT 'active',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tax Returns / Filings
CREATE TABLE IF NOT EXISTS revenue_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id) ON DELETE CASCADE,
    tax_type TEXT NOT NULL,
    return_period TEXT NOT NULL,
    return_period_start DATE,
    return_period_end DATE,
    filing_type TEXT DEFAULT 'original',
    line_items JSONB DEFAULT '[]',
    gross_amount DECIMAL(15,2) DEFAULT 0,
    taxable_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_liability DECIMAL(15,2) DEFAULT 0,
    tax_paid DECIMAL(15,2) DEFAULT 0,
    tax_due DECIMAL(15,2) DEFAULT 0,
    penalty_amount DECIMAL(15,2) DEFAULT 0,
    interest_amount DECIMAL(15,2) DEFAULT 0,
    total_due DECIMAL(15,2) DEFAULT 0,
    filing_status TEXT DEFAULT 'draft',
    payment_status TEXT DEFAULT 'unpaid',
    assessment_status TEXT DEFAULT 'pending',
    filed_by UUID,
    filed_at TIMESTAMPTZ,
    assessed_by UUID,
    assessed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tax Payments (integrates with wallet/escrow)
CREATE TABLE IF NOT EXISTS revenue_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id) ON DELETE CASCADE,
    return_id UUID REFERENCES revenue_returns(id) ON DELETE SET NULL,
    tax_type TEXT NOT NULL,
    payment_method TEXT DEFAULT 'wallet',
    wallet_id UUID,
    escrow_id UUID,
    transaction_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'KES',
    payment_reference TEXT,
    prn_number TEXT,
    payment_status TEXT DEFAULT 'pending',
    bank_code TEXT,
    bank_account TEXT,
    mpesa_receipt TEXT,
    card_last4 TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tax Assessments (by revenue officers)
CREATE TABLE IF NOT EXISTS revenue_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id) ON DELETE CASCADE,
    return_id UUID REFERENCES revenue_returns(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL DEFAULT 'auto',
    assessment_basis TEXT,
    assessed_amount DECIMAL(15,2) NOT NULL,
    previous_amount DECIMAL(15,2) DEFAULT 0,
    difference DECIMAL(15,2) DEFAULT 0,
    penalty_percentage DECIMAL(5,2) DEFAULT 0,
    penalty_amount DECIMAL(15,2) DEFAULT 0,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    interest_amount DECIMAL(15,2) DEFAULT 0,
    total_assessment DECIMAL(15,2) DEFAULT 0,
    assessment_status TEXT DEFAULT 'issued',
    officer_id UUID,
    officer_notes TEXT,
    taxpayer_response TEXT,
    objection_filed BOOLEAN DEFAULT false,
    objection_date TIMESTAMPTZ,
    waiver_requested BOOLEAN DEFAULT false,
    waiver_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exemptions & Relief Applications
CREATE TABLE IF NOT EXISTS revenue_exemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id) ON DELETE CASCADE,
    exemption_type TEXT NOT NULL,
    tax_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    supporting_docs JSONB DEFAULT '[]',
    requested_amount DECIMAL(15,2),
    approved_amount DECIMAL(15,2) DEFAULT 0,
    exemption_period_start DATE,
    exemption_period_end DATE,
    application_status TEXT DEFAULT 'pending',
    reviewed_by UUID,
    review_notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance & Audit Log
CREATE TABLE IF NOT EXISTS revenue_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id) ON DELETE CASCADE,
    compliance_year INTEGER,
    filing_count INTEGER DEFAULT 0,
    late_filing_count INTEGER DEFAULT 0,
    missed_filing_count INTEGER DEFAULT 0,
    penalty_total DECIMAL(15,2) DEFAULT 0,
    payment_total DECIMAL(15,2) DEFAULT 0,
    outstanding_balance DECIMAL(15,2) DEFAULT 0,
    audit_flag TEXT DEFAULT 'green',
    audit_flag_reason TEXT,
    last_audit_date TIMESTAMPTZ,
    next_audit_date TIMESTAMPTZ,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue Officers
CREATE TABLE IF NOT EXISTS revenue_officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    officer_number TEXT NOT NULL UNIQUE,
    department TEXT,
    station TEXT,
    region TEXT,
    designation TEXT,
    clearance_level INTEGER DEFAULT 1,
    cases_assigned INTEGER DEFAULT 0,
    cases_closed INTEGER DEFAULT 0,
    revenue_collected DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Country Tax Configuration
CREATE TABLE IF NOT EXISTS revenue_country_config (
    country_code TEXT PRIMARY KEY,
    country_name TEXT NOT NULL,
    authority_name TEXT NOT NULL,
    authority_short TEXT NOT NULL,
    currency_code TEXT NOT NULL,
    currency_symbol TEXT NOT NULL,
    taxpayer_id_format TEXT NOT NULL,
    taxpayer_id_example TEXT,
    tax_types JSONB NOT NULL DEFAULT '[]',
    vat_rate DECIMAL(5,2) DEFAULT 16.00,
    corporate_rate DECIMAL(5,2) DEFAULT 30.00,
    income_brackets JSONB DEFAULT '[]',
    penalty_rate_daily DECIMAL(5,2) DEFAULT 2.00,
    interest_rate_annual DECIMAL(5,2) DEFAULT 12.00,
    filing_deadline_day INTEGER DEFAULT 20,
    payment_deadline_days INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default country configs for major African markets
INSERT INTO revenue_country_config (country_code, country_name, authority_name, authority_short, currency_code, currency_symbol, taxpayer_id_format, taxpayer_id_example, tax_types, vat_rate, corporate_rate, penalty_rate_daily, interest_rate_annual, filing_deadline_day)
VALUES
('KE', 'Kenya', 'Kenya Revenue Authority', 'KRA', 'KES', 'KSh', 'A[0-9]{9}[A-Z]', 'A001234567B', '[{"type": "income", "name": "Income Tax", "rate": 30}, {"type": "vat", "name": "Value Added Tax", "rate": 16}, {"type": "corporate", "name": "Corporate Tax", "rate": 30}, {"type": "import", "name": "Import Duty", "rate": 25}, {"type": "excise", "name": "Excise Duty", "rate": 15}, {"type": "property", "name": "Property Tax", "rate": 2}]', 16.00, 30.00, 2.00, 12.00, 20),
('UG', 'Uganda', 'Uganda Revenue Authority', 'URA', 'UGX', 'USh', '[0-9]{10}', '1234567890', '[{"type": "income", "name": "Income Tax", "rate": 30}, {"type": "vat", "name": "Value Added Tax", "rate": 18}, {"type": "corporate", "name": "Corporate Tax", "rate": 30}, {"type": "import", "name": "Import Duty", "rate": 25}, {"type": "excise", "name": "Excise Duty", "rate": 12}]', 18.00, 30.00, 2.00, 12.00, 15),
('GH', 'Ghana', 'Ghana Revenue Authority', 'GRA', 'GHS', 'GH₵', '[A-Z]{2}[0-9]{10}', 'GH1234567890', '[{"type": "income", "name": "Income Tax", "rate": 25}, {"type": "vat", "name": "Value Added Tax", "rate": 15}, {"type": "corporate", "name": "Corporate Tax", "rate": 25}, {"type": "import", "name": "Import Duty", "rate": 20}, {"type": "excise", "name": "Excise Duty", "rate": 10}]', 15.00, 25.00, 2.00, 12.00, 21),
('NG', 'Nigeria', 'Federal Inland Revenue Service', 'FIRS', 'NGN', '₦', '[0-9]{10}-[0-9]{1}', '1234567890-1', '[{"type": "income", "name": "Personal Income Tax", "rate": 24}, {"type": "vat", "name": "Value Added Tax", "rate": 7.5}, {"type": "corporate", "name": "Companies Income Tax", "rate": 30}, {"type": "import", "name": "Customs Duty", "rate": 20}, {"type": "excise", "name": "Excise Duty", "rate": 5}]', 7.50, 30.00, 2.00, 12.00, 21),
('ZA', 'South Africa', 'South African Revenue Service', 'SARS', 'ZAR', 'R', '[0-9]{10}', '1234567890', '[{"type": "income", "name": "Income Tax", "rate": 45}, {"type": "vat", "name": "Value Added Tax", "rate": 15}, {"type": "corporate", "name": "Corporate Tax", "rate": 27}, {"type": "import", "name": "Customs Duty", "rate": 20}, {"type": "excise", "name": "Excise Duty", "rate": 10}]', 15.00, 27.00, 2.00, 12.00, 25),
('TZ', 'Tanzania', 'Tanzania Revenue Authority', 'TRA', 'TZS', 'TSh', '[0-9]{9}[A-Z]{1}', '123456789T', '[{"type": "income", "name": "Income Tax", "rate": 30}, {"type": "vat", "name": "Value Added Tax", "rate": 18}, {"type": "corporate", "name": "Corporate Tax", "rate": 30}, {"type": "import", "name": "Import Duty", "rate": 25}]', 18.00, 30.00, 2.00, 12.00, 20),
('RW', 'Rwanda', 'Rwanda Revenue Authority', 'RRA', 'RWF', 'FRw', '[0-9]{9}', '123456789', '[{"type": "income", "name": "Income Tax", "rate": 30}, {"type": "vat", "name": "Value Added Tax", "rate": 18}, {"type": "corporate", "name": "Corporate Tax", "rate": 30}]', 18.00, 30.00, 2.00, 12.00, 15)
ON CONFLICT (country_code) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_taxpayers_country ON revenue_taxpayers(country_code);
CREATE INDEX IF NOT EXISTS idx_revenue_taxpayers_profile ON revenue_taxpayers(profile_id);
CREATE INDEX IF NOT EXISTS idx_revenue_taxpayers_tin ON revenue_taxpayers(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_revenue_returns_country ON revenue_returns(country_code);
CREATE INDEX IF NOT EXISTS idx_revenue_returns_taxpayer ON revenue_returns(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_revenue_returns_period ON revenue_returns(return_period);
CREATE INDEX IF NOT EXISTS idx_revenue_payments_country ON revenue_payments(country_code);
CREATE INDEX IF NOT EXISTS idx_revenue_payments_return ON revenue_payments(return_id);
CREATE INDEX IF NOT EXISTS idx_revenue_assessments_country ON revenue_assessments(country_code);
CREATE INDEX IF NOT EXISTS idx_revenue_exemptions_country ON revenue_exemptions(country_code);
CREATE INDEX IF NOT EXISTS idx_revenue_compliance_country ON revenue_compliance(country_code);
CREATE INDEX IF NOT EXISTS idx_revenue_officers_country ON revenue_officers(country_code);

-- RLS Policies
ALTER TABLE revenue_taxpayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_country_config ENABLE ROW LEVEL SECURITY;

-- Taxpayers: view own or officer view by country
CREATE POLICY "taxpayers_self_or_officer" ON revenue_taxpayers
    FOR ALL USING (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM revenue_officers WHERE profile_id = auth.uid() AND country_code = revenue_taxpayers.country_code)
    );

-- Returns: view own or officer
CREATE POLICY "returns_self_or_officer" ON revenue_returns
    FOR ALL USING (
        taxpayer_id IN (SELECT id FROM revenue_taxpayers WHERE profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM revenue_officers WHERE profile_id = auth.uid() AND country_code = revenue_returns.country_code)
    );

-- Payments: view own or officer
CREATE POLICY "payments_self_or_officer" ON revenue_payments
    FOR ALL USING (
        taxpayer_id IN (SELECT id FROM revenue_taxpayers WHERE profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM revenue_officers WHERE profile_id = auth.uid() AND country_code = revenue_payments.country_code)
    );

-- Assessments: officer only for create/update, taxpayer view own
CREATE POLICY "assessments_officer" ON revenue_assessments
    FOR ALL USING (
        taxpayer_id IN (SELECT id FROM revenue_taxpayers WHERE profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM revenue_officers WHERE profile_id = auth.uid() AND country_code = revenue_assessments.country_code)
    );

-- Exemptions: same pattern
CREATE POLICY "exemptions_self_or_officer" ON revenue_exemptions
    FOR ALL USING (
        taxpayer_id IN (SELECT id FROM revenue_taxpayers WHERE profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM revenue_officers WHERE profile_id = auth.uid() AND country_code = revenue_exemptions.country_code)
    );

-- Compliance: officer view, taxpayer view own
CREATE POLICY "compliance_self_or_officer" ON revenue_compliance
    FOR ALL USING (
        taxpayer_id IN (SELECT id FROM revenue_taxpayers WHERE profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM revenue_officers WHERE profile_id = auth.uid() AND country_code = revenue_compliance.country_code)
    );

-- Officers: self view, admin all
CREATE POLICY "officers_self" ON revenue_officers
    FOR ALL USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Country config: public read, admin write
CREATE POLICY "country_config_public" ON revenue_country_config FOR SELECT USING (true);
CREATE POLICY "country_config_admin" ON revenue_country_config FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER update_revenue_taxpayers_updated_at BEFORE UPDATE ON revenue_taxpayers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenue_returns_updated_at BEFORE UPDATE ON revenue_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenue_assessments_updated_at BEFORE UPDATE ON revenue_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenue_exemptions_updated_at BEFORE UPDATE ON revenue_exemptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenue_compliance_updated_at BEFORE UPDATE ON revenue_compliance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenue_officers_updated_at BEFORE UPDATE ON revenue_officers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenue_country_config_updated_at BEFORE UPDATE ON revenue_country_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
