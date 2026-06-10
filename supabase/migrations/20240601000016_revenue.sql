
-- ============================================
-- CIVIC v2 — REVENUE AUTHORITY MODULE SCHEMA
-- ============================================
-- Applicable to ANY country. Design principles:
--   - station_wallet_id on every collection point
--   - jurisdiction_id maps to county/region/district
--   - All tax types use generic obligation pattern
--   - E-invoicing linked to taxpayer PIN/TIN
--   - Audit trail on every mutation
--   - No country-specific hardcodes — all configurable

-- ============================================
-- 1. REVENUE WORKSTATIONS (Tax offices nationwide)
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_workstations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    jurisdiction_id UUID NOT NULL, -- links to civic jurisdiction
    jurisdiction_level TEXT NOT NULL CHECK (jurisdiction_level IN ('national','county','sub_county','ward','village')),
    country TEXT NOT NULL DEFAULT 'Kenya',
    address TEXT,
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    station_wallet_id TEXT, -- for localized collections
    services_offered TEXT[] DEFAULT '{}', -- ['income_tax','vat','licenses','permits']
    operating_hours JSONB DEFAULT '{"mon_fri":"08:00-17:00","sat":"09:00-13:00"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. REVENUE STAFF (Officers, inspectors, collectors)
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID NOT NULL REFERENCES revenue_workstations(id),
    employee_number TEXT UNIQUE,
    full_name TEXT NOT NULL,
    designation TEXT NOT NULL CHECK (designation IN ('commissioner','deputy_commissioner','senior_officer','officer','inspector','collector','clerk','support')),
    department TEXT NOT NULL CHECK (department IN ('domestic_tax','customs','excise','property_tax','business_licensing','audit','enforcement','admin','it')),
    specialization TEXT[], -- ['vat_audit','transfer_pricing','customs_valuation']
    phone TEXT,
    email TEXT,
    badge_number TEXT,
    shift TEXT DEFAULT 'day' CHECK (shift IN ('day','night','rotating','field')),
    territory_assigned TEXT, -- JSONB of wards/counties
    station_wallet_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. TAXPAYER REGISTRY (Master — individuals + businesses)
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_taxpayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxpayer_type TEXT NOT NULL CHECK (taxpayer_type IN ('individual','business','partnership','trust','ngo','government')),
    pin TEXT UNIQUE, -- Personal Identification Number / TIN
    id_number TEXT, -- National ID / passport
    full_name TEXT NOT NULL,
    trading_name TEXT, -- Business name
    email TEXT,
    phone TEXT,
    address TEXT,
    county TEXT,
    sub_county TEXT,
    ward TEXT,
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    industry_sector TEXT, -- Agriculture, Retail, Manufacturing, etc.
    business_registration_number TEXT,
    vat_registered BOOLEAN DEFAULT false,
    vat_number TEXT,
    annual_turnover DECIMAL(15,2),
    employee_count INTEGER,
    tax_band TEXT CHECK (tax_band IN ('micro','small','medium','large','enterprise')),
    compliance_status TEXT DEFAULT 'compliant' CHECK (compliance_status IN ('compliant','non_compliant','under_review','suspended','deregistered')),
    risk_score INTEGER DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
    last_filing_date DATE,
    last_payment_date DATE,
    total_paid_ytd DECIMAL(15,2) DEFAULT 0,
    total_owed_ytd DECIMAL(15,2) DEFAULT 0,
    bank_accounts JSONB, -- [{bank,branch,account_number}]
    digital_contacts JSONB, -- [{platform,handle}]
    documents JSONB, -- [{type,url,verified}]
    verified_by UUID REFERENCES revenue_staff(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. TAX OBLIGATIONS (What taxpayer owes, by type)
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_tax_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id) ON DELETE CASCADE,
    tax_type TEXT NOT NULL CHECK (tax_type IN ('income_tax','vat','excise_duty','property_tax','business_license','stamp_duty','customs_duty','turnover_tax','digital_services_tax','withholding_tax','capital_gains_tax','environmental_levy','agency_revenue')),
    tax_period_start DATE NOT NULL,
    tax_period_end DATE NOT NULL,
    tax_year INTEGER NOT NULL,
    amount_assessed DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount_outstanding DECIMAL(15,2) GENERATED ALWAYS AS (amount_assessed - amount_paid) STORED,
    penalty_amount DECIMAL(15,2) DEFAULT 0,
    interest_amount DECIMAL(15,2) DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','filed','partially_paid','paid','overdue','waived','under_dispute')),
    filing_deadline DATE,
    payment_deadline DATE,
    workstation_id UUID REFERENCES revenue_workstations(id),
    assessed_by UUID REFERENCES revenue_staff(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. TAX RETURNS (Filed declarations)
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id),
    obligation_id UUID REFERENCES revenue_tax_obligations(id),
    tax_type TEXT NOT NULL,
    tax_period_start DATE NOT NULL,
    tax_period_end DATE NOT NULL,
    tax_year INTEGER NOT NULL,
    return_type TEXT NOT NULL CHECK (return_type IN ('original','amended','nil','estimated')),
    gross_income DECIMAL(15,2),
    allowable_deductions DECIMAL(15,2),
    taxable_amount DECIMAL(15,2),
    tax_rate_applied DECIMAL(5,4),
    tax_liability DECIMAL(15,2),
    tax_credits DECIMAL(15,2) DEFAULT 0,
    net_tax_payable DECIMAL(15,2),
    withholding_tax_paid DECIMAL(15,2) DEFAULT 0,
    installment_tax_paid DECIMAL(15,2) DEFAULT 0,
    documents_attached JSONB, -- [{filename,url,type}]
    filed_by TEXT, -- taxpayer or agent name
    filed_via TEXT DEFAULT 'portal' CHECK (filed_via IN ('portal','mobile','workstation','api','bulk_upload')),
    filed_at TIMESTAMPTZ DEFAULT now(),
    acknowledged_by UUID REFERENCES revenue_staff(id),
    acknowledgement_date TIMESTAMPTZ,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft','submitted','under_review','accepted','rejected','under_audit')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. REVENUE PAYMENTS (Collection ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id),
    obligation_id UUID REFERENCES revenue_tax_obligations(id),
    return_id UUID REFERENCES revenue_returns(id),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('income_tax','vat','excise','property_tax','license_fee','stamp_duty','customs','turnover_tax','digital_tax','withholding','capital_gains','penalty','interest','agency_collection')),
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'KES',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa','bank_transfer','card','wallet','cash','cheque','rtgs','swift')),
    payment_reference TEXT NOT NULL, -- transaction ID from payment provider
    receipt_number TEXT UNIQUE NOT NULL,
    station_wallet_id TEXT NOT NULL,
    workstation_id UUID REFERENCES revenue_workstations(id),
    collected_by UUID REFERENCES revenue_staff(id),
    payment_date TIMESTAMPTZ DEFAULT now(),
    fiscal_year INTEGER,
    tax_period TEXT, -- e.g. "2026-Q1"
    is_reversal BOOLEAN DEFAULT false,
    reversed_payment_id UUID REFERENCES revenue_payments(id),
    reversal_reason TEXT,
    metadata JSONB, -- provider response, KRA reference, etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. E-INVOICES / FISCAL RECEIPTS
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id), -- seller
    buyer_pin TEXT, -- buyer's PIN if registered
    buyer_name TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    items JSONB NOT NULL, -- [{description,qty,unit_price,total,vat_rate,vat_amount}]
    subtotal DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    excise_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'KES',
    status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','amended','void')),
    fiscal_device_id TEXT, -- EFD serial number
    cu_invoice_number TEXT, -- Control Unit invoice number
    qr_code_url TEXT,
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending','validated','rejected')),
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. BUSINESS LICENSES & PERMITS
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id),
    license_type TEXT NOT NULL CHECK (license_type IN ('trade_license','health_permit','building_permit','liquor_license','transport_permit','fire_safety','environmental','signage','market_stall','hawker','professional')),
    license_number TEXT UNIQUE NOT NULL,
    issuing_workstation_id UUID REFERENCES revenue_workstations(id),
    issued_by UUID REFERENCES revenue_staff(id),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    renewal_reminder_sent BOOLEAN DEFAULT false,
    fee_amount DECIMAL(12,2) NOT NULL,
    fee_paid DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','suspended','revoked','under_renewal')),
    business_activity TEXT,
    premises_address TEXT,
    inspection_required BOOLEAN DEFAULT false,
    last_inspection_date DATE,
    inspection_result TEXT CHECK (inspection_result IN ('pass','fail','conditional')),
    conditions TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. AUDIT CASES
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id),
    audit_type TEXT NOT NULL CHECK (audit_type IN ('desk_review','field_audit','transfer_pricing','customs_valuation','vat_refund','criminal_investigation','compliance_check')),
    tax_type TEXT NOT NULL,
    tax_period_start DATE,
    tax_period_end DATE,
    tax_year INTEGER,
    assigned_officer_id UUID REFERENCES revenue_staff(id),
    workstation_id UUID REFERENCES revenue_workstations(id),
    risk_score INTEGER,
    trigger_reason TEXT, -- why selected: random, risk, tipoff, anomaly
    status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated','notice_issued','document_request','field_visit','assessment','objection_period','closed','escalated')),
    amount_assessed DECIMAL(15,2),
    amount_recovered DECIMAL(15,2),
    penalties_imposed DECIMAL(15,2),
    findings TEXT,
    recommendations TEXT,
    notice_date DATE,
    closure_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 10. DEBT COLLECTION
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id),
    obligation_id UUID REFERENCES revenue_tax_obligations(id),
    debt_type TEXT NOT NULL CHECK (debt_type IN ('tax_arrears','penalty','interest','license_fee','agency_collection')),
    principal_amount DECIMAL(15,2) NOT NULL,
    accrued_interest DECIMAL(15,2) DEFAULT 0,
    total_due DECIMAL(15,2) GENERATED ALWAYS AS (principal_amount + accrued_interest) STORED,
    days_overdue INTEGER DEFAULT 0,
    collection_stage TEXT DEFAULT 'reminder' CHECK (collection_stage IN ('reminder','demand_notice','garnishment','lien','auction','litigation','write_off')),
    last_reminder_sent DATE,
    reminder_count INTEGER DEFAULT 0,
    assigned_collector_id UUID REFERENCES revenue_staff(id),
    payment_plan_active BOOLEAN DEFAULT false,
    payment_plan_terms JSONB, -- {installments,amount, frequency}
    status TEXT DEFAULT 'active' CHECK (status IN ('active','paid','under_plan','disputed','written_off')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 11. OBJECTIONS & APPEALS
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_objections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id),
    obligation_id UUID REFERENCES revenue_tax_obligations(id),
    audit_id UUID REFERENCES revenue_audits(id),
    objection_type TEXT NOT NULL CHECK (objection_type IN ('assessment','penalty','denial_of_refund','license_revocation','debt_collection')),
    grounds TEXT NOT NULL,
    amount_disputed DECIMAL(15,2),
    documents_attached JSONB,
    filed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'filed' CHECK (status IN ('filed','under_review','hearing_scheduled','upheld','overturned','partially_upheld','withdrawn')),
    hearing_date DATE,
    decision_date DATE,
    decision_summary TEXT,
    decided_by UUID REFERENCES revenue_staff(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 12. REFUNDS
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taxpayer_id UUID NOT NULL REFERENCES revenue_taxpayers(id),
    obligation_id UUID REFERENCES revenue_tax_obligations(id),
    return_id UUID REFERENCES revenue_returns(id),
    refund_type TEXT NOT NULL CHECK (refund_type IN ('vat_refund','overpayment','withholding_excess','duplicate_payment','error_correction')),
    amount_claimed DECIMAL(15,2) NOT NULL,
    amount_approved DECIMAL(15,2),
    amount_paid DECIMAL(15,2) DEFAULT 0,
    claim_reason TEXT NOT NULL,
    supporting_documents JSONB,
    bank_account JSONB, -- {bank,branch,account_number,swift}
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','under_verification','approved','rejected','paid','partially_paid')),
    submitted_at TIMESTAMPTZ DEFAULT now(),
    verified_by UUID REFERENCES revenue_staff(id),
    verified_at TIMESTAMPTZ,
    approved_by UUID REFERENCES revenue_staff(id),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 13. STAFF ATTENDANCE
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID NOT NULL REFERENCES revenue_workstations(id),
    staff_id UUID NOT NULL,
    staff_name TEXT NOT NULL,
    staff_type TEXT NOT NULL CHECK (staff_type IN ('commissioner','officer','inspector','collector','clerk','support')),
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    hours_worked DECIMAL(4,2),
    territory_covered TEXT, -- JSONB of locations visited
    collections_made DECIMAL(15,2) DEFAULT 0,
    taxpayers_served INTEGER DEFAULT 0,
    verified_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 14. PAYROLL
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID NOT NULL REFERENCES revenue_workstations(id),
    staff_id UUID NOT NULL,
    staff_name TEXT NOT NULL,
    staff_type TEXT NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    base_amount DECIMAL(12,2) NOT NULL,
    field_allowance DECIMAL(12,2) DEFAULT 0,
    performance_bonus DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','disputed')),
    paid_date TIMESTAMPTZ,
    transaction_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 15. PROCUREMENT
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_procurement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID NOT NULL REFERENCES revenue_workstations(id),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('it_equipment','vehicles','office_furniture','security_equipment','fiscal_devices','stationery','training','consultancy','building_maintenance')),
    quantity INT NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    vendor_name TEXT,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested','approved','ordered','delivered','rejected')),
    requested_by UUID,
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_taxpayers_pin ON revenue_taxpayers(pin);
CREATE INDEX IF NOT EXISTS idx_taxpayers_type ON revenue_taxpayers(taxpayer_type);
CREATE INDEX IF NOT EXISTS idx_taxpayers_compliance ON revenue_taxpayers(compliance_status);
CREATE INDEX IF NOT EXISTS idx_taxpayers_risk ON revenue_taxpayers(risk_score);
CREATE INDEX IF NOT EXISTS idx_obligations_taxpayer ON revenue_tax_obligations(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_obligations_type ON revenue_tax_obligations(tax_type);
CREATE INDEX IF NOT EXISTS idx_obligations_status ON revenue_obligations(status);
CREATE INDEX IF NOT EXISTS idx_obligations_due ON revenue_tax_obligations(due_date);
CREATE INDEX IF NOT EXISTS idx_returns_taxpayer ON revenue_returns(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON revenue_returns(status);
CREATE INDEX IF NOT EXISTS idx_payments_taxpayer ON revenue_payments(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_payments_obligation ON revenue_payments(obligation_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON revenue_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON revenue_payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_invoices_taxpayer ON revenue_invoices(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON revenue_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_licenses_taxpayer ON revenue_licenses(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON revenue_licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expiry ON revenue_licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_audits_taxpayer ON revenue_audits(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON revenue_audits(status);
CREATE INDEX IF NOT EXISTS idx_debts_taxpayer ON revenue_debts(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_debts_stage ON revenue_debts(collection_stage);
CREATE INDEX IF NOT EXISTS idx_objections_taxpayer ON revenue_objections(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_refunds_taxpayer ON revenue_refunds(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_staff_workstation ON revenue_staff(workstation_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON revenue_staff_attendance(shift_date);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON revenue_payroll(pay_period_start, pay_period_end);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE revenue_workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_taxpayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tax_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_procurement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_read_all" ON revenue_workstations FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_taxpayers FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_tax_obligations FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_licenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_audits FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_debts FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_objections FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_refunds FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_staff_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_payroll FOR SELECT TO authenticated USING (true);
CREATE POLICY "revenue_read_all" ON revenue_procurement FOR SELECT TO authenticated USING (true);

CREATE POLICY "revenue_write_all" ON revenue_workstations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_taxpayers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_tax_obligations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_licenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_debts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_objections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_refunds FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_staff_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_payroll FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "revenue_write_all" ON revenue_procurement FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update taxpayer totals when payment made
CREATE OR REPLACE FUNCTION trg_taxpayer_payment_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE revenue_taxpayers
    SET total_paid_ytd = total_paid_ytd + NEW.amount,
        last_payment_date = NEW.payment_date::DATE,
        updated_at = now()
    WHERE id = NEW.taxpayer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS taxpayer_payment_update ON revenue_payments;
CREATE TRIGGER taxpayer_payment_update
    AFTER INSERT ON revenue_payments
    FOR EACH ROW
    EXECUTE FUNCTION trg_taxpayer_payment_update();

-- Auto-update obligation status when payment recorded
CREATE OR REPLACE FUNCTION trg_obligation_payment_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.obligation_id IS NOT NULL THEN
        UPDATE revenue_tax_obligations
        SET amount_paid = amount_paid + NEW.amount,
            status = CASE 
                WHEN (amount_paid + NEW.amount) >= amount_assessed THEN 'paid'
                WHEN (amount_paid + NEW.amount) > 0 THEN 'partially_paid'
                ELSE status
            END,
            updated_at = now()
        WHERE id = NEW.obligation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS obligation_payment_update ON revenue_payments;
CREATE TRIGGER obligation_payment_update
    AFTER INSERT ON revenue_payments
    FOR EACH ROW
    EXECUTE FUNCTION trg_obligation_payment_update();

-- Auto-create debt record when obligation becomes overdue
CREATE OR REPLACE FUNCTION trg_create_debt_on_overdue()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'overdue' AND OLD.status != 'overdue' THEN
        INSERT INTO revenue_debts (
            taxpayer_id, obligation_id, debt_type, principal_amount,
            days_overdue, collection_stage, status, created_at
        )
        SELECT 
            NEW.taxpayer_id, NEW.id, NEW.tax_type, NEW.amount_outstanding,
            CURRENT_DATE - NEW.due_date, 'reminder', 'active', now()
        WHERE NOT EXISTS (
            SELECT 1 FROM revenue_debts WHERE obligation_id = NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_debt_on_overdue ON revenue_tax_obligations;
CREATE TRIGGER create_debt_on_overdue
    AFTER UPDATE ON revenue_tax_obligations
    FOR EACH ROW
    EXECUTE FUNCTION trg_create_debt_on_overdue();

-- Auto-update debt days_overdue daily (run via cron/edge function)
CREATE OR REPLACE FUNCTION trg_update_debt_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days_overdue = CURRENT_DATE - (
        SELECT due_date FROM revenue_tax_obligations WHERE id = NEW.obligation_id
    );
    -- Escalate collection stage based on days
    NEW.collection_stage = CASE
        WHEN NEW.days_overdue > 365 THEN 'litigation'
        WHEN NEW.days_overdue > 180 THEN 'auction'
        WHEN NEW.days_overdue > 90 THEN 'lien'
        WHEN NEW.days_overdue > 60 THEN 'garnishment'
        WHEN NEW.days_overdue > 30 THEN 'demand_notice'
        ELSE 'reminder'
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_debt_days ON revenue_debts;
CREATE TRIGGER update_debt_days
    BEFORE UPDATE ON revenue_debts
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_debt_days();

-- Auto-update license status on expiry
CREATE OR REPLACE FUNCTION trg_license_expiry_check()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiry_date < CURRENT_DATE AND NEW.status = 'active' THEN
        NEW.status = 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS license_expiry_check ON revenue_licenses;
CREATE TRIGGER license_expiry_check
    BEFORE UPDATE ON revenue_licenses
    FOR EACH ROW
    EXECUTE FUNCTION trg_license_expiry_check();

-- Auto-update taxpayer compliance status
CREATE OR REPLACE FUNCTION trg_update_compliance_status()
RETURNS TRIGGER AS $$
DECLARE
    v_overdue_count INTEGER;
    v_total_obligations INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_overdue_count
    FROM revenue_tax_obligations
    WHERE taxpayer_id = NEW.taxpayer_id AND status = 'overdue';

    SELECT COUNT(*) INTO v_total_obligations
    FROM revenue_tax_obligations
    WHERE taxpayer_id = NEW.taxpayer_id;

    UPDATE revenue_taxpayers
    SET compliance_status = CASE
        WHEN v_overdue_count = 0 THEN 'compliant'
        WHEN v_overdue_count <= v_total_obligations * 0.2 THEN 'under_review'
        ELSE 'non_compliant'
    END,
    updated_at = now()
    WHERE id = NEW.taxpayer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_compliance_status ON revenue_tax_obligations;
CREATE TRIGGER update_compliance_status
    AFTER UPDATE ON revenue_tax_obligations
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_compliance_status();

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO revenue_workstations (workstation_number, name, jurisdiction_level, country, address, services_offered) VALUES
('REV-001', 'Nairobi Central Revenue Office', 'county', 'Kenya', 'City Hall Way, Nairobi', ARRAY['income_tax','vat','licenses','permits']),
('REV-002', 'Mombasa Revenue Office', 'county', 'Kenya', 'Moi Avenue, Mombasa', ARRAY['income_tax','vat','customs','licenses']),
('REV-003', 'Kisumu Revenue Office', 'sub_county', 'Kenya', 'Oginga Odinga Street, Kisumu', ARRAY['income_tax','vat','licenses']),
('REV-004', 'Nakuru Revenue Office', 'county', 'Kenya', 'Kenyatta Avenue, Nakuru', ARRAY['income_tax','vat','property_tax','licenses']),
('REV-005', 'National Revenue HQ', 'national', 'Kenya', 'Times Tower, Nairobi', ARRAY['income_tax','vat','excise_duty','customs','property_tax','digital_services_tax'])
ON CONFLICT DO NOTHING;
