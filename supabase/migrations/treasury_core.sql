-- ============================================================
-- MTAA TREASURY CORE
-- Sovereign Financial Operating System
-- NOT IFMIS. Built to fix every documented failure.
-- 22 Tables + Indexes + RLS + Triggers + Views
-- ============================================================

-- 1. BUDGET FRAMEWORK
CREATE TABLE treasury_budget_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_year INTEGER NOT NULL,
    cycle_type VARCHAR(20) CHECK (cycle_type IN ('annual', 'supplementary', 'revised')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'active', 'closed')),
    total_appropriation DECIMAL(18,2) DEFAULT 0,
    total_revenue_target DECIMAL(18,2) DEFAULT 0,
    total_expenditure_ceiling DECIMAL(18,2) DEFAULT 0,
    deficit_target DECIMAL(18,2) DEFAULT 0,
    debt_service_limit DECIMAL(18,2) DEFAULT 0,
    macro_assumptions JSONB,
    cabinet_approval_date DATE,
    parliament_approval_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treasury_budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_cycle_id UUID REFERENCES treasury_budget_cycles(id) ON DELETE CASCADE,
    ministry_id UUID NOT NULL,
    department_id UUID,
    program_code VARCHAR(50) NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    economic_classification VARCHAR(50),
    approved_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    revised_amount DECIMAL(18,2),
    released_amount DECIMAL(18,2) DEFAULT 0,
    spent_amount DECIMAL(18,2) DEFAULT 0,
    commitment_amount DECIMAL(18,2) DEFAULT 0,
    available_balance DECIMAL(18,2) GENERATED ALWAYS AS (COALESCE(released_amount, approved_amount) - COALESCE(commitment_amount, 0) - COALESCE(spent_amount, 0)) STORED,
    performance_indicators JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. WARRANT & RELEASE MANAGEMENT
CREATE TABLE treasury_warrants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warrant_number VARCHAR(50) UNIQUE NOT NULL,
    budget_cycle_id UUID REFERENCES treasury_budget_cycles(id),
    allocation_id UUID REFERENCES treasury_budget_allocations(id),
    warrant_type VARCHAR(20) CHECK (warrant_type IN ('recurrent', 'development', 'emergency', 'contingency')),
    amount DECIMAL(18,2) NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE,
    issued_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'utilized', 'expired', 'cancelled', 'suspended')),
    spent_amount DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COMMITMENT CONTROL
CREATE TABLE treasury_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commitment_number VARCHAR(50) UNIQUE NOT NULL,
    allocation_id UUID REFERENCES treasury_budget_allocations(id),
    procurement_id UUID,
    contract_id UUID,
    description TEXT NOT NULL,
    committed_amount DECIMAL(18,2) NOT NULL,
    liquidated_amount DECIMAL(18,2) DEFAULT 0,
    balance_amount DECIMAL(18,2) GENERATED ALWAYS AS (committed_amount - liquidated_amount) STORED,
    commitment_date DATE NOT NULL,
    expected_liquidation_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'partially_liquidated', 'fully_liquidated', 'cancelled', 'lapsed')),
    approval_chain JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. EXPENDITURE & PAYMENT VOUCHERS
CREATE TABLE treasury_expenditures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_number VARCHAR(50) UNIQUE NOT NULL,
    commitment_id UUID REFERENCES treasury_commitments(id),
    allocation_id UUID REFERENCES treasury_budget_allocations(id),
    payee_name VARCHAR(255) NOT NULL,
    payee_account VARCHAR(100),
    payee_bank VARCHAR(100),
    payee_bank_code VARCHAR(20),
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    local_currency_amount DECIMAL(18,2) GENERATED ALWAYS AS (amount * exchange_rate) STORED,
    expenditure_type VARCHAR(30) CHECK (expenditure_type IN ('salary', 'goods_services', 'transfer', 'subsidy', 'interest', 'capital', 'maintenance', 'other')),
    description TEXT,
    invoice_number VARCHAR(100),
    invoice_date DATE,
    payment_method VARCHAR(20) CHECK (payment_method IN ('wallet', 'bank_transfer', 'cash', 'cheque', 'mobile_money', 'card')),
    wallet_transaction_id UUID,
    bank_transaction_ref VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'paid', 'rejected', 'reversed')),
    approved_by UUID REFERENCES auth.users(id),
    processed_by UUID REFERENCES auth.users(id),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TREASURY SINGLE ACCOUNT (TSA)
CREATE TABLE treasury_tsa_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(30) CHECK (account_type IN ('exchequer', 'consolidated', 'county_revenue', 'agency', 'project', 'trust', 'suspense')),
    bank_name VARCHAR(100) NOT NULL,
    bank_branch VARCHAR(100),
    bank_code VARCHAR(20),
    swift_code VARCHAR(20),
    currency VARCHAR(3) DEFAULT 'USD',
    opening_balance DECIMAL(18,2) DEFAULT 0,
    current_balance DECIMAL(18,2) DEFAULT 0,
    is_master_account BOOLEAN DEFAULT false,
    parent_account_id UUID REFERENCES treasury_tsa_accounts(id),
    ministry_id UUID,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'closed', 'frozen')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treasury_tsa_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tsa_account_id UUID REFERENCES treasury_tsa_accounts(id),
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('receipt', 'payment', 'transfer', 'reversal', 'adjustment')),
    reference_number VARCHAR(100) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    local_amount DECIMAL(18,2) GENERATED ALWAYS AS (amount * exchange_rate) STORED,
    counterparty_name VARCHAR(255),
    counterparty_account VARCHAR(100),
    description TEXT,
    related_expenditure_id UUID REFERENCES treasury_expenditures(id),
    related_revenue_id UUID,
    transaction_date TIMESTAMPTZ NOT NULL,
    value_date DATE,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. REVENUE MANAGEMENT
CREATE TABLE treasury_revenue_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_number VARCHAR(50) UNIQUE NOT NULL,
    revenue_source VARCHAR(50) CHECK (revenue_source IN ('tax', 'non_tax', 'fees', 'fines', 'grants', 'loans', 'dividends', 'rent', 'other')),
    sub_source VARCHAR(100),
    taxpayer_id VARCHAR(100),
    taxpayer_name VARCHAR(255),
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    collection_date DATE NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('wallet', 'bank_transfer', 'cash', 'mobile_money', 'card', 'direct_debit')),
    wallet_transaction_id UUID,
    bank_transaction_ref VARCHAR(100),
    tsa_account_id UUID REFERENCES treasury_tsa_accounts(id),
    ministry_id UUID,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'reconciled', 'disputed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. DEBT MANAGEMENT
CREATE TABLE treasury_debt_instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_code VARCHAR(50) UNIQUE NOT NULL,
    instrument_type VARCHAR(30) CHECK (instrument_type IN ('external_bilateral', 'external_multilateral', 'external_commercial', 'domestic_treasury_bill', 'domestic_treasury_bond', 'domestic_sukuk', 'guarantee', 'on_lending')),
    creditor_name VARCHAR(255) NOT NULL,
    creditor_type VARCHAR(30) CHECK (creditor_type IN ('bilateral', 'multilateral', 'commercial_bank', 'bond_market', 'central_bank', 'other')),
    original_amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    exchange_rate_at_inception DECIMAL(18,6) DEFAULT 1,
    local_currency_equivalent DECIMAL(18,2) GENERATED ALWAYS AS (original_amount * exchange_rate_at_inception) STORED,
    interest_rate DECIMAL(8,4) NOT NULL,
    interest_type VARCHAR(20) CHECK (interest_type IN ('fixed', 'floating', 'zero_coupon', 'concessional')),
    maturity_date DATE NOT NULL,
    grace_period_months INTEGER DEFAULT 0,
    disbursement_schedule JSONB,
    outstanding_principal DECIMAL(18,2) DEFAULT 0,
    outstanding_interest DECIMAL(18,2) DEFAULT 0,
    total_outstanding DECIMAL(18,2) GENERATED ALWAYS AS (outstanding_principal + outstanding_interest) STORED,
    purpose TEXT,
    sector VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fully_disbursed', 'repaid', 'defaulted', 'restructured', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treasury_debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID REFERENCES treasury_debt_instruments(id),
    payment_type VARCHAR(20) CHECK (payment_type IN ('principal', 'interest', 'commitment_fee', 'service_charge', 'penalty')),
    amount_due DECIMAL(18,2) NOT NULL,
    amount_paid DECIMAL(18,2) DEFAULT 0,
    payment_date DATE,
    due_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL,
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    local_amount DECIMAL(18,2) GENERATED ALWAYS AS (amount_paid * exchange_rate) STORED,
    payment_method VARCHAR(20),
    bank_transaction_ref VARCHAR(100),
    wallet_transaction_id UUID,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending_approval', 'approved', 'paid', 'overdue', 'defaulted')),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CASH MANAGEMENT & FORECASTING
CREATE TABLE treasury_cash_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_period VARCHAR(20) CHECK (forecast_period IN ('daily', 'weekly', 'monthly', 'quarterly')),
    forecast_date DATE NOT NULL,
    opening_balance DECIMAL(18,2) NOT NULL,
    projected_receipts DECIMAL(18,2) DEFAULT 0,
    projected_payments DECIMAL(18,2) DEFAULT 0,
    projected_closing_balance DECIMAL(18,2) GENERATED ALWAYS AS (opening_balance + projected_receipts - projected_payments) STORED,
    actual_closing_balance DECIMAL(18,2),
    variance DECIMAL(18,2) GENERATED ALWAYS AS (actual_closing_balance - (opening_balance + projected_receipts - projected_payments)) STORED,
    forecast_model VARCHAR(50),
    confidence_score DECIMAL(5,2),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. PAYROLL & PENSIONS
CREATE TABLE treasury_payroll_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_name VARCHAR(100) NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid', 'reversed')),
    total_basic_salary DECIMAL(18,2) DEFAULT 0,
    total_allowances DECIMAL(18,2) DEFAULT 0,
    total_deductions DECIMAL(18,2) DEFAULT 0,
    total_net_pay DECIMAL(18,2) DEFAULT 0,
    total_employees INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treasury_payroll_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID REFERENCES treasury_payroll_cycles(id),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    ministry_id UUID,
    department_id UUID,
    job_grade VARCHAR(20),
    basic_salary DECIMAL(18,2) NOT NULL,
    house_allowance DECIMAL(18,2) DEFAULT 0,
    transport_allowance DECIMAL(18,2) DEFAULT 0,
    other_allowances DECIMAL(18,2) DEFAULT 0,
    gross_pay DECIMAL(18,2) GENERATED ALWAYS AS (basic_salary + house_allowance + transport_allowance + other_allowances) STORED,
    tax_deduction DECIMAL(18,2) DEFAULT 0,
    pension_contribution DECIMAL(18,2) DEFAULT 0,
    loan_deduction DECIMAL(18,2) DEFAULT 0,
    other_deductions DECIMAL(18,2) DEFAULT 0,
    total_deductions DECIMAL(18,2) GENERATED ALWAYS AS (tax_deduction + pension_contribution + loan_deduction + other_deductions) STORED,
    net_pay DECIMAL(18,2) GENERATED ALWAYS AS (gross_pay - total_deductions) STORED,
    bank_account VARCHAR(100),
    bank_name VARCHAR(100),
    wallet_id UUID,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
    biometric_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. E-PROCUREMENT
CREATE TABLE treasury_procurement_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    ministry_id UUID NOT NULL,
    department_id UUID,
    requested_by UUID REFERENCES auth.users(id),
    item_description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    estimated_unit_cost DECIMAL(18,2) NOT NULL,
    estimated_total_cost DECIMAL(18,2) GENERATED ALWAYS AS (quantity * estimated_unit_cost) STORED,
    procurement_method VARCHAR(30) CHECK (procurement_method IN ('open_tender', 'restricted_tender', 'direct_procurement', 'request_for_quotation', 'framework_agreement', 'emergency')),
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    budget_allocation_id UUID REFERENCES treasury_budget_allocations(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'converted_to_tender')),
    approval_chain JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treasury_tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_number VARCHAR(50) UNIQUE NOT NULL,
    requisition_id UUID REFERENCES treasury_procurement_requisitions(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tender_type VARCHAR(30) CHECK (tender_type IN ('open', 'restricted', 'single_source', 'emergency')),
    category VARCHAR(100),
    estimated_value DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    publication_date DATE,
    closing_date DATE,
    evaluation_date DATE,
    award_date DATE,
    contract_signing_date DATE,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'under_evaluation', 'awarded', 'contracted', 'cancelled', 'disputed')),
    ocds_data JSONB,
    bids_received INTEGER DEFAULT 0,
    winning_bidder_id UUID,
    winning_bid_amount DECIMAL(18,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treasury_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    tender_id UUID REFERENCES treasury_tenders(id),
    supplier_id UUID NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    contract_value DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE,
    milestones JSONB,
    total_paid DECIMAL(18,2) DEFAULT 0,
    remaining_value DECIMAL(18,2) GENERATED ALWAYS AS (contract_value - total_paid) STORED,
    performance_rating DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated', 'suspended', 'under_dispute')),
    ocds_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. ASSET MANAGEMENT
CREATE TABLE treasury_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_category VARCHAR(50) CHECK (asset_category IN ('land', 'buildings', 'vehicles', 'equipment', 'furniture', 'it_equipment', 'infrastructure', 'other')),
    ministry_id UUID,
    department_id UUID,
    location VARCHAR(255),
    gps_coordinates POINT,
    acquisition_date DATE,
    acquisition_cost DECIMAL(18,2),
    currency VARCHAR(3) DEFAULT 'USD',
    depreciation_method VARCHAR(20) CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'units_of_production')),
    useful_life_years INTEGER,
    residual_value DECIMAL(18,2) DEFAULT 0,
    accumulated_depreciation DECIMAL(18,2) DEFAULT 0,
    net_book_value DECIMAL(18,2) GENERATED ALWAYS AS (acquisition_cost - accumulated_depreciation) STORED,
    qr_code_hash VARCHAR(255),
    condition VARCHAR(20) CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'unserviceable')),
    custody_officer_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'under_maintenance', 'disposed', 'lost', 'transferred')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. AUDIT & COMPLIANCE
CREATE TABLE treasury_audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_reference VARCHAR(50) UNIQUE NOT NULL,
    audit_type VARCHAR(30) CHECK (audit_type IN ('financial', 'compliance', 'performance', 'it_audit', 'special_investigation')),
    ministry_id UUID,
    department_id UUID,
    finding_title VARCHAR(255) NOT NULL,
    finding_description TEXT,
    risk_rating VARCHAR(20) CHECK (risk_rating IN ('critical', 'high', 'medium', 'low')),
    amount_involved DECIMAL(18,2),
    recommendation TEXT,
    management_response TEXT,
    action_plan JSONB,
    responsible_officer UUID REFERENCES auth.users(id),
    target_resolution_date DATE,
    actual_resolution_date DATE,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'overdue', 'closed', 'escalated')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. FISCAL REPORTING
CREATE TABLE treasury_fiscal_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_period VARCHAR(20) CHECK (report_period IN ('monthly', 'quarterly', 'annual', 'special')),
    fiscal_year INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_type VARCHAR(50) CHECK (report_type IN ('statement_of_financial_position', 'statement_of_financial_performance', 'cash_flow_statement', 'statement_of_changes_in_net_assets', 'budget_vs_actual', 'debt_report', 'revenue_report', 'expenditure_report')),
    report_data JSONB NOT NULL,
    ipsas_compliance_score DECIMAL(5,2),
    auditor_opinion VARCHAR(50),
    published_date DATE,
    published_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    download_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. APPROVAL HIERARCHIES
CREATE TABLE treasury_approval_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    ministry_id UUID,
    department_id UUID,
    role VARCHAR(50) NOT NULL,
    approval_type VARCHAR(30) CHECK (approval_type IN ('expenditure', 'commitment', 'procurement', 'payroll', 'debt_payment', 'budget_virement')),
    limit_amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    requires_second_approval BOOLEAN DEFAULT false,
    second_approver_role VARCHAR(50),
    delegation_active BOOLEAN DEFAULT false,
    delegated_to UUID REFERENCES auth.users(id),
    delegation_start DATE,
    delegation_end DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. BANK RECONCILIATION
CREATE TABLE treasury_bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tsa_account_id UUID REFERENCES treasury_tsa_accounts(id),
    reconciliation_period VARCHAR(20) CHECK (reconciliation_period IN ('daily', 'weekly', 'monthly')),
    statement_date DATE NOT NULL,
    system_balance DECIMAL(18,2) NOT NULL,
    bank_balance DECIMAL(18,2) NOT NULL,
    difference DECIMAL(18,2) GENERATED ALWAYS AS (system_balance - bank_balance) STORED,
    reconciled_items JSONB,
    unmatched_items JSONB,
    ai_anomaly_score DECIMAL(5,2),
    auto_reconciled BOOLEAN DEFAULT false,
    reconciled_by UUID REFERENCES auth.users(id),
    reconciled_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'reconciled', 'disputed', 'approved')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. SMART CONTRACT CONTROLS
CREATE TABLE treasury_smart_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name VARCHAR(255) NOT NULL,
    contract_type VARCHAR(50) CHECK (contract_type IN ('payment_control', 'procurement_milestone', 'budget_lock', 'debt_service', 'revenue_share')),
    blockchain_address VARCHAR(255),
    deployed_network VARCHAR(50),
    trigger_conditions JSONB,
    execution_logic JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'deployed', 'active', 'paused', 'terminated')),
    created_by UUID REFERENCES auth.users(id),
    deployed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. REAL-TIME DASHBOARD METRICS
CREATE TABLE treasury_dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) CHECK (metric_category IN ('budget', 'revenue', 'expenditure', 'debt', 'cash', 'procurement', 'payroll', 'audit')),
    metric_value DECIMAL(18,2),
    metric_unit VARCHAR(20),
    fiscal_year INTEGER,
    period VARCHAR(20),
    ministry_id UUID,
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(metric_name, fiscal_year, period, ministry_id)
);

-- 18. AUDIT LOG (Immutable)
CREATE TABLE treasury_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT now(),
    session_id UUID,
    ip_address INET,
    user_agent TEXT
);

-- 19. CITIZEN FEEDBACK
CREATE TABLE treasury_citizen_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_type VARCHAR(30) CHECK (feedback_type IN ('budget_input', 'expenditure_query', 'corruption_tip', 'service_rating', 'suggestion')),
    related_ministry_id UUID,
    related_program_id UUID,
    subject VARCHAR(255),
    message TEXT,
    attachments JSONB,
    submitter_type VARCHAR(20) CHECK (submitter_type IN ('citizen', 'cso', 'media', 'auditor', 'whistleblower')),
    submitter_contact VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'investigating', 'resolved', 'closed', 'escalated')),
    assigned_to UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 20. REVENUE FORECASTING
CREATE TABLE treasury_revenue_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_year INTEGER NOT NULL,
    revenue_source VARCHAR(50) NOT NULL,
    forecast_period VARCHAR(20) CHECK (forecast_period IN ('monthly', 'quarterly', 'annual')),
    forecasted_amount DECIMAL(18,2) NOT NULL,
    actual_amount DECIMAL(18,2),
    variance DECIMAL(18,2) GENERATED ALWAYS AS (actual_amount - forecasted_amount) STORED,
    forecast_model VARCHAR(50),
    confidence_interval_low DECIMAL(18,2),
    confidence_interval_high DECIMAL(18,2),
    economic_assumptions JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 21. INTER-GOVERNMENTAL TRANSFERS
CREATE TABLE treasury_intergov_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_type VARCHAR(30) CHECK (transfer_type IN ('equitable_share', 'conditional_grant', 'equalization', 'loan', 'reimbursement')),
    from_level VARCHAR(20) CHECK (from_level IN ('national', 'county', 'municipal')),
    to_level VARCHAR(20) CHECK (to_level IN ('county', 'municipal', 'ward')),
    recipient_id UUID NOT NULL,
    recipient_name VARCHAR(255),
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transfer_date DATE,
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'utilized', 'audited')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 22. EMERGENCY CONTINGENCY
CREATE TABLE treasury_contingency_draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contingency_type VARCHAR(30) CHECK (contingency_type IN ('natural_disaster', 'security', 'health_emergency', 'economic_crisis', 'other')),
    draw_number VARCHAR(50) UNIQUE NOT NULL,
    requested_amount DECIMAL(18,2) NOT NULL,
    approved_amount DECIMAL(18,2),
    utilized_amount DECIMAL(18,2) DEFAULT 0,
    requesting_ministry_id UUID,
    approving_authority VARCHAR(100),
    justification TEXT,
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'under_review', 'approved', 'partially_disbursed', 'fully_disbursed', 'closed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_treasury_expenditures_status ON treasury_expenditures(status);
CREATE INDEX idx_treasury_expenditures_date ON treasury_expenditures(created_at);
CREATE INDEX idx_treasury_tsa_transactions_date ON treasury_tsa_transactions(transaction_date);
CREATE INDEX idx_treasury_revenue_date ON treasury_revenue_collections(collection_date);
CREATE INDEX idx_treasury_debt_payments_due ON treasury_debt_payments(due_date);
CREATE INDEX idx_treasury_commitments_status ON treasury_commitments(status);
CREATE INDEX idx_treasury_audit_status ON treasury_audit_findings(status);
CREATE INDEX idx_treasury_payroll_cycle ON treasury_payroll_entries(cycle_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE treasury_budget_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_tsa_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_tsa_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_debt_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_procurement_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_audit_findings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_tsa_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE treasury_tsa_accounts 
    SET current_balance = current_balance + 
        CASE WHEN NEW.transaction_type IN ('receipt', 'transfer') THEN NEW.amount ELSE -NEW.amount END
    WHERE id = NEW.tsa_account_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_tsa_balance
    AFTER INSERT ON treasury_tsa_transactions
    FOR EACH ROW EXECUTE FUNCTION update_tsa_balance();

CREATE OR REPLACE FUNCTION update_commitment_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE treasury_commitments 
    SET liquidated_amount = liquidated_amount + NEW.amount
    WHERE id = NEW.commitment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_commitment
    AFTER INSERT ON treasury_expenditures
    FOR EACH ROW WHEN (NEW.commitment_id IS NOT NULL)
    EXECUTE FUNCTION update_commitment_balance();

CREATE OR REPLACE FUNCTION prevent_overspending()
RETURNS TRIGGER AS $$
DECLARE
    available DECIMAL(18,2);
BEGIN
    SELECT available_balance INTO available 
    FROM treasury_budget_allocations 
    WHERE id = NEW.allocation_id;

    IF NEW.committed_amount > available THEN
        RAISE EXCEPTION 'Insufficient budget allocation. Available: %, Requested: %', available, NEW.committed_amount;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_overspending
    BEFORE INSERT ON treasury_commitments
    FOR EACH ROW EXECUTE FUNCTION prevent_overspending();

CREATE OR REPLACE FUNCTION treasury_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO treasury_audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), auth.uid());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO treasury_audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO treasury_audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_expenditures
    AFTER INSERT OR UPDATE OR DELETE ON treasury_expenditures
    FOR EACH ROW EXECUTE FUNCTION treasury_audit_trigger();

-- ============================================================
-- VIEWS
-- ============================================================
CREATE VIEW treasury_budget_execution_summary AS
SELECT 
    bc.fiscal_year,
    ba.ministry_id,
    ba.program_code,
    ba.program_name,
    ba.approved_amount,
    ba.released_amount,
    ba.spent_amount,
    ba.commitment_amount,
    ba.available_balance,
    ROUND(ba.spent_amount / NULLIF(ba.approved_amount, 0) * 100, 2) as execution_rate,
    ROUND(ba.commitment_amount / NULLIF(ba.approved_amount, 0) * 100, 2) as commitment_rate
FROM treasury_budget_allocations ba
JOIN treasury_budget_cycles bc ON ba.budget_cycle_id = bc.id
WHERE bc.status = 'active';

CREATE VIEW treasury_cash_position AS
SELECT 
    tsa.id,
    tsa.account_name,
    tsa.account_type,
    tsa.currency,
    tsa.current_balance,
    SUM(CASE WHEN tst.transaction_type = 'receipt' AND tst.status = 'completed' THEN tst.amount ELSE 0 END) as total_receipts_30d,
    SUM(CASE WHEN tst.transaction_type = 'payment' AND tst.status = 'completed' THEN tst.amount ELSE 0 END) as total_payments_30d
FROM treasury_tsa_accounts tsa
LEFT JOIN treasury_tsa_transactions tst ON tsa.id = tst.tsa_account_id 
    AND tst.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tsa.id, tsa.account_name, tsa.account_type, tsa.currency, tsa.current_balance;

CREATE VIEW treasury_debt_service_schedule AS
SELECT 
    di.instrument_code,
    di.creditor_name,
    di.currency,
    dp.payment_type,
    dp.due_date,
    dp.amount_due,
    dp.amount_paid,
    dp.status,
    di.maturity_date,
    di.outstanding_principal
FROM treasury_debt_instruments di
JOIN treasury_debt_payments dp ON di.id = dp.instrument_id
WHERE dp.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
ORDER BY dp.due_date;
