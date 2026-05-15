
-- MTAA AFRIQ — Treasury Engine (Country-Agnostic)
-- Government financial management: budgets, allocations, expenditures, revenue consolidation

-- Treasury Accounts (consolidated fund, recurrent, development, contingency)
CREATE TABLE IF NOT EXISTS treasury_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'consolidated',
    parent_account_id UUID REFERENCES treasury_accounts(id) ON DELETE SET NULL,
    fiscal_year INTEGER NOT NULL,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    budget_approved DECIMAL(15,2) DEFAULT 0,
    budget_revised DECIMAL(15,2) DEFAULT 0,
    budget_utilized DECIMAL(15,2) DEFAULT 0,
    budget_remaining DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'KES',
    account_status TEXT DEFAULT 'active',
    ministry_id UUID,
    department_id UUID,
    county_id UUID,
    ward_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(country_code, account_code, fiscal_year)
);

-- Budget Allocations (approved budget lines)
CREATE TABLE IF NOT EXISTS treasury_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    budget_code TEXT NOT NULL,
    budget_name TEXT NOT NULL,
    fiscal_year INTEGER NOT NULL,
    budget_type TEXT NOT NULL DEFAULT 'recurrent',
    account_id UUID REFERENCES treasury_accounts(id) ON DELETE CASCADE,
    ministry TEXT,
    department TEXT,
    programme TEXT,
    sub_programme TEXT,
    economic_category TEXT,
    item_description TEXT,
    approved_amount DECIMAL(15,2) DEFAULT 0,
    revised_amount DECIMAL(15,2) DEFAULT 0,
    allocated_amount DECIMAL(15,2) DEFAULT 0,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    committed_amount DECIMAL(15,2) DEFAULT 0,
    available_amount DECIMAL(15,2) DEFAULT 0,
    variance_amount DECIMAL(15,2) DEFAULT 0,
    variance_percentage DECIMAL(5,2) DEFAULT 0,
    performance_rating TEXT DEFAULT 'on_track',
    approval_status TEXT DEFAULT 'draft',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Expenditure / Vouchers
CREATE TABLE IF NOT EXISTS treasury_expenditures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    voucher_number TEXT NOT NULL,
    budget_id UUID REFERENCES treasury_budgets(id) ON DELETE CASCADE,
    account_id UUID REFERENCES treasury_accounts(id) ON DELETE CASCADE,
    expenditure_type TEXT NOT NULL DEFAULT 'goods_services',
    payee_name TEXT,
    payee_type TEXT,
    payee_account TEXT,
    payee_bank TEXT,
    payee_bank_code TEXT,
    description TEXT,
    line_items JSONB DEFAULT '[]',
    gross_amount DECIMAL(15,2) DEFAULT 0,
    deductions JSONB DEFAULT '[]',
    net_amount DECIMAL(15,2) DEFAULT 0,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    withholding_tax DECIMAL(15,2) DEFAULT 0,
    withholding_vat DECIMAL(15,2) DEFAULT 0,
    stamp_duty DECIMAL(15,2) DEFAULT 0,
    excise_duty DECIMAL(15,2) DEFAULT 0,
    other_taxes DECIMAL(15,2) DEFAULT 0,
    total_taxes DECIMAL(15,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'eft',
    payment_status TEXT DEFAULT 'pending',
    cleared_at TIMESTAMPTZ,
    clearance_reference TEXT,
    procurement_method TEXT,
    contract_number TEXT,
    grn_number TEXT,
    lpo_number TEXT,
    votebook_entry TEXT,
    imprest_number TEXT,
    imprest_status TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    authorized_by UUID,
    authorized_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(country_code, voucher_number, fiscal_year)
);

-- Revenue Consolidation (from all sources)
CREATE TABLE IF NOT EXISTS treasury_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    revenue_source TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'tax',
    account_id UUID REFERENCES treasury_accounts(id) ON DELETE SET NULL,
    fiscal_year INTEGER NOT NULL,
    revenue_period TEXT,
    projected_amount DECIMAL(15,2) DEFAULT 0,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    variance_amount DECIMAL(15,2) DEFAULT 0,
    variance_percentage DECIMAL(5,2) DEFAULT 0,
    collection_efficiency DECIMAL(5,2) DEFAULT 0,
    revenue_category TEXT,
    sub_category TEXT,
    ministry_source TEXT,
    department_source TEXT,
    collection_method TEXT,
    receipt_number TEXT,
    bank_deposit_slip TEXT,
    reconciled BOOLEAN DEFAULT false,
    reconciliation_date TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cash Flow / Daily Treasury Position
CREATE TABLE IF NOT EXISTS treasury_cashflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    account_id UUID REFERENCES treasury_accounts(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_type TEXT NOT NULL,
    reference_number TEXT,
    description TEXT,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    closing_balance DECIMAL(15,2) DEFAULT 0,
    cumulative_receipts DECIMAL(15,2) DEFAULT 0,
    cumulative_payments DECIMAL(15,2) DEFAULT 0,
    net_position DECIMAL(15,2) DEFAULT 0,
    liquidity_status TEXT DEFAULT 'adequate',
    overdraft_amount DECIMAL(15,2) DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Appropriations / Warrants (spending authority)
CREATE TABLE IF NOT EXISTS treasury_warrants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    warrant_number TEXT NOT NULL,
    warrant_type TEXT NOT NULL DEFAULT 'annual',
    account_id UUID REFERENCES treasury_accounts(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES treasury_budgets(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER,
    month INTEGER,
    warrant_amount DECIMAL(15,2) DEFAULT 0,
    utilized_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) DEFAULT 0,
    warrant_status TEXT DEFAULT 'active',
    issued_by UUID,
    issued_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(country_code, warrant_number, fiscal_year)
);

-- Treasury Reports / Audit Trail
CREATE TABLE IF NOT EXISTS treasury_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    report_type TEXT NOT NULL,
    report_period TEXT,
    fiscal_year INTEGER,
    quarter INTEGER,
    month INTEGER,
    report_data JSONB DEFAULT '{}',
    summary_metrics JSONB DEFAULT '{}',
    generated_by UUID,
    generated_at TIMESTAMPTZ DEFAULT now(),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    download_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Treasury Officers / Controllers
CREATE TABLE IF NOT EXISTS treasury_officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL DEFAULT 'KE',
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    officer_number TEXT NOT NULL UNIQUE,
    designation TEXT,
    department TEXT,
    ministry TEXT,
    clearance_level INTEGER DEFAULT 1,
    can_approve BOOLEAN DEFAULT false,
    can_authorize BOOLEAN DEFAULT false,
    can_reconcile BOOLEAN DEFAULT false,
    signature_hash TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Country Treasury Config
CREATE TABLE IF NOT EXISTS treasury_country_config (
    country_code TEXT PRIMARY KEY,
    country_name TEXT NOT NULL,
    treasury_name TEXT NOT NULL,
    treasury_short TEXT NOT NULL,
    currency_code TEXT NOT NULL,
    currency_symbol TEXT NOT NULL,
    fiscal_year_start DATE,
    fiscal_year_end DATE,
    current_fiscal_year INTEGER,
    current_quarter INTEGER,
    vat_rate DECIMAL(5,2) DEFAULT 16.00,
    withholding_income_tax DECIMAL(5,2) DEFAULT 5.00,
    withholding_vat DECIMAL(5,2) DEFAULT 6.00,
    stamp_duty_rate DECIMAL(5,2) DEFAULT 1.00,
    excise_rate DECIMAL(5,2) DEFAULT 15.00,
    imprest_limit DECIMAL(15,2) DEFAULT 50000,
    petty_cash_limit DECIMAL(15,2) DEFAULT 10000,
    single_procurement_threshold DECIMAL(15,2) DEFAULT 500000,
    competitive_procurement_threshold DECIMAL(15,2) DEFAULT 5000000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default configs
INSERT INTO treasury_country_config (country_code, country_name, treasury_name, treasury_short, currency_code, currency_symbol, current_fiscal_year, current_quarter, fiscal_year_start, fiscal_year_end)
VALUES
('KE', 'Kenya', 'National Treasury', 'Treasury', 'KES', 'KSh', 2026, 2, '2025-07-01', '2026-06-30'),
('UG', 'Uganda', 'Ministry of Finance', 'MoFPED', 'UGX', 'USh', 2026, 2, '2025-07-01', '2026-06-30'),
('GH', 'Ghana', 'Ministry of Finance', 'MoF', 'GHS', 'GH₵', 2026, 2, '2025-01-01', '2025-12-31'),
('NG', 'Nigeria', 'Ministry of Finance', 'FMoF', 'NGN', '₦', 2026, 2, '2025-01-01', '2025-12-31'),
('ZA', 'South Africa', 'National Treasury', 'Treasury', 'ZAR', 'R', 2026, 2, '2025-04-01', '2026-03-31'),
('TZ', 'Tanzania', 'Ministry of Finance', 'MoFP', 'TZS', 'TSh', 2026, 2, '2025-07-01', '2026-06-30'),
('RW', 'Rwanda', 'Ministry of Finance', 'MINECOFIN', 'RWF', 'FRw', 2026, 2, '2025-07-01', '2026-06-30')
ON CONFLICT (country_code) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_country ON treasury_accounts(country_code);
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_fiscal ON treasury_accounts(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_treasury_budgets_country ON treasury_budgets(country_code);
CREATE INDEX IF NOT EXISTS idx_treasury_budgets_fiscal ON treasury_budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_treasury_expenditures_country ON treasury_expenditures(country_code);
CREATE INDEX IF NOT EXISTS idx_treasury_expenditures_budget ON treasury_expenditures(budget_id);
CREATE INDEX IF NOT EXISTS idx_treasury_revenue_country ON treasury_revenue(country_code);
CREATE INDEX IF NOT EXISTS idx_treasury_cashflow_country ON treasury_cashflow(country_code);
CREATE INDEX IF NOT EXISTS idx_treasury_warrants_country ON treasury_warrants(country_code);
CREATE INDEX IF NOT EXISTS idx_treasury_reports_country ON treasury_reports(country_code);
CREATE INDEX IF NOT EXISTS idx_treasury_officers_country ON treasury_officers(country_code);

-- RLS
ALTER TABLE treasury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_cashflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_warrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_country_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treasury_officer_access" ON treasury_accounts FOR ALL USING (
    EXISTS (SELECT 1 FROM treasury_officers WHERE profile_id = auth.uid() AND country_code = treasury_accounts.country_code)
);
CREATE POLICY "treasury_budget_officer" ON treasury_budgets FOR ALL USING (
    EXISTS (SELECT 1 FROM treasury_officers WHERE profile_id = auth.uid() AND country_code = treasury_budgets.country_code)
);
CREATE POLICY "treasury_expenditure_officer" ON treasury_expenditures FOR ALL USING (
    EXISTS (SELECT 1 FROM treasury_officers WHERE profile_id = auth.uid() AND country_code = treasury_expenditures.country_code)
);
CREATE POLICY "treasury_revenue_officer" ON treasury_revenue FOR ALL USING (
    EXISTS (SELECT 1 FROM treasury_officers WHERE profile_id = auth.uid() AND country_code = treasury_revenue.country_code)
);
CREATE POLICY "treasury_cashflow_officer" ON treasury_cashflow FOR ALL USING (
    EXISTS (SELECT 1 FROM treasury_officers WHERE profile_id = auth.uid() AND country_code = treasury_cashflow.country_code)
);
CREATE POLICY "treasury_warrant_officer" ON treasury_warrants FOR ALL USING (
    EXISTS (SELECT 1 FROM treasury_officers WHERE profile_id = auth.uid() AND country_code = treasury_warrants.country_code)
);
CREATE POLICY "treasury_report_officer" ON treasury_reports FOR ALL USING (
    EXISTS (SELECT 1 FROM treasury_officers WHERE profile_id = auth.uid() AND country_code = treasury_reports.country_code)
);
CREATE POLICY "treasury_officer_self" ON treasury_officers FOR ALL USING (
    profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "treasury_config_public" ON treasury_country_config FOR SELECT USING (true);
CREATE POLICY "treasury_config_admin" ON treasury_country_config FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Triggers
CREATE TRIGGER update_treasury_accounts_updated_at BEFORE UPDATE ON treasury_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treasury_budgets_updated_at BEFORE UPDATE ON treasury_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treasury_expenditures_updated_at BEFORE UPDATE ON treasury_expenditures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treasury_revenue_updated_at BEFORE UPDATE ON treasury_revenue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treasury_warrants_updated_at BEFORE UPDATE ON treasury_warrants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treasury_officers_updated_at BEFORE UPDATE ON treasury_officers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treasury_country_config_updated_at BEFORE UPDATE ON treasury_country_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
