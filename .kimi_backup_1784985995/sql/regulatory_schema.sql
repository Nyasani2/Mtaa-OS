-- ═══════════════════════════════════════════════════════════════════════════════
-- MTAA WALLET V2 — REGULATORY LAYER SQL SCHEMA (FIXED)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. AUDIT LOG (Immutable record of all changes)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Audit trigger function (NO auth.uid() dependency)
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_ledger') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_wallet_ledger') THEN
      CREATE TRIGGER trg_audit_wallet_ledger
      AFTER INSERT OR UPDATE OR DELETE ON wallet_ledger
      FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_transactions') THEN
      CREATE TRIGGER trg_audit_transactions
      AFTER INSERT OR UPDATE OR DELETE ON transactions
      FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_wallets') THEN
      CREATE TRIGGER trg_audit_wallets
      AFTER INSERT OR UPDATE OR DELETE ON wallets
      FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
    END IF;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. REGULATORY FLAGS (Suspicious activity flags)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS regulatory_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID,
  user_id UUID NOT NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'velocity', 'amount', 'geo_anomaly', 'new_recipient', 'device_change',
    'pin_failure', 'duplicate_claim', 'onboarding_loop', 'structuring',
    'terrorism_finance', 'sanctions_match', 'pep_match', 'adverse_media'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'false_positive', 'escalated')),
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  assigned_to UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_flags_user ON regulatory_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_flags_status ON regulatory_flags(status);
CREATE INDEX IF NOT EXISTS idx_regulatory_flags_type ON regulatory_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_regulatory_flags_severity ON regulatory_flags(severity);
CREATE INDEX IF NOT EXISTS idx_regulatory_flags_created ON regulatory_flags(created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. COMPLIANCE REPORTS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type TEXT NOT NULL CHECK (report_type IN (
    'daily_summary', 'weekly_summary', 'monthly_summary',
    'suspicious_activity', 'large_transactions', 'cross_border',
    'merchant_summary', 'kyc_status', 'sanctions_screening'
  )),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'KE',
  total_volume NUMERIC(20, 2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  flagged_transactions INTEGER DEFAULT 0,
  flagged_amount NUMERIC(20, 2) DEFAULT 0,
  report_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged', 'rejected')),
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_period ON compliance_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TAX RECORDS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tax_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID,
  user_id UUID NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('vat', 'withholding', 'income', 'capital_gains', 'excise', 'stamp_duty')),
  taxable_amount NUMERIC(20, 2) NOT NULL,
  tax_rate NUMERIC(5, 4) NOT NULL,
  tax_amount NUMERIC(20, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  tax_period DATE NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'KE',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filed', 'paid', 'disputed', 'waived')),
  filed_at TIMESTAMPTZ,
  filed_by UUID,
  receipt_number TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_records_user ON tax_records(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_records_period ON tax_records(tax_period);
CREATE INDEX IF NOT EXISTS idx_tax_records_status ON tax_records(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. SANCTIONS SCREENING
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sanctions_screening (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('individual', 'business', 'transaction')),
  entity_id UUID NOT NULL,
  screening_list TEXT NOT NULL,
  match_score NUMERIC(5, 2) CHECK (match_score >= 0 AND match_score <= 100),
  match_details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'flagged', 'confirmed_match')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sanctions_screening_entity ON sanctions_screening(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_screening_status ON sanctions_screening(status);
CREATE INDEX IF NOT EXISTS idx_sanctions_screening_score ON sanctions_screening(match_score);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. CBK REPORTING
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cbk_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_period DATE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'psd_return', 'mfs_statistics', 'agent_network', 'fraud_incidents',
    'consumer_complaints', 'system_downtime', 'liquidity_report'
  )),
  institution_code TEXT NOT NULL DEFAULT 'MTAA001',
  data JSONB NOT NULL DEFAULT '{}',
  file_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbk_reports_period ON cbk_reports(report_period);
CREATE INDEX IF NOT EXISTS idx_cbk_reports_type ON cbk_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_cbk_reports_status ON cbk_reports(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. RBAC — FINANCIAL ADMIN ROLES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS financial_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]',
  jurisdiction TEXT DEFAULT 'KE',
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_financial_roles_assignments_user ON financial_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_roles_assignments_role ON financial_role_assignments(role_id);

-- Insert default financial admin roles
INSERT INTO financial_roles (name, description, permissions, is_system_role) VALUES
('cbk_admin', 'Central Bank Administrator', 
 '["view_all_transactions", "view_audit_logs", "generate_reports", "manage_flags", "view_cbk_dashboard", "submit_cbk_reports", "manage_sanctions"]'::jsonb, TRUE),
('tax_admin', 'Tax Authority Administrator',
 '["view_tax_records", "generate_tax_reports", "file_tax_returns", "view_tax_dashboard", "manage_tax_disputes"]'::jsonb, TRUE),
('fraud_analyst', 'Fraud Analyst',
 '["view_flags", "manage_flags", "view_transactions", "view_audit_logs", "view_fraud_dashboard", "create_investigations"]'::jsonb, TRUE),
('compliance_officer', 'Compliance Officer',
 '["view_compliance_reports", "generate_compliance_reports", "manage_sanctions", "view_audit_logs", "view_compliance_dashboard"]'::jsonb, TRUE),
('audit_viewer', 'Audit Viewer',
 '["view_audit_logs", "view_transactions", "view_reports"]'::jsonb, TRUE)
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_screening ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbk_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_role_assignments ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user has permission
CREATE OR REPLACE FUNCTION has_financial_permission(p_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM financial_role_assignments fra
    JOIN financial_roles fr ON fra.role_id = fr.id
    WHERE fra.user_id = auth.uid()
    AND fra.is_active = TRUE
    AND fr.permissions @> jsonb_build_array(p_permission)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit logs: Admin read-only
DROP POLICY IF EXISTS audit_logs_admin_select ON audit_logs;
CREATE POLICY audit_logs_admin_select ON audit_logs FOR SELECT USING (has_financial_permission('view_audit_logs'));

-- Regulatory flags: Admin can view/manage, users can see own
DROP POLICY IF EXISTS regulatory_flags_admin_select ON regulatory_flags;
DROP POLICY IF EXISTS regulatory_flags_admin_update ON regulatory_flags;
CREATE POLICY regulatory_flags_admin_select ON regulatory_flags FOR SELECT USING (
  has_financial_permission('manage_flags') OR auth.uid() = user_id
);
CREATE POLICY regulatory_flags_admin_update ON regulatory_flags FOR UPDATE USING (
  has_financial_permission('manage_flags')
);

-- Compliance reports: Admin access
DROP POLICY IF EXISTS compliance_reports_admin ON compliance_reports;
CREATE POLICY compliance_reports_admin ON compliance_reports FOR ALL USING (
  has_financial_permission('generate_reports')
);

-- Tax records: Tax admin + own records
DROP POLICY IF EXISTS tax_records_admin ON tax_records;
CREATE POLICY tax_records_admin ON tax_records FOR ALL USING (
  has_financial_permission('view_tax_records') OR auth.uid() = user_id
);

-- Sanctions screening: Admin only
DROP POLICY IF EXISTS sanctions_screening_admin ON sanctions_screening;
CREATE POLICY sanctions_screening_admin ON sanctions_screening FOR ALL USING (
  has_financial_permission('manage_sanctions')
);

-- CBK reports: CBK admin only
DROP POLICY IF EXISTS cbk_reports_admin ON cbk_reports;
CREATE POLICY cbk_reports_admin ON cbk_reports FOR ALL USING (
  has_financial_permission('submit_cbk_reports')
);

-- Financial roles: Admin only
DROP POLICY IF EXISTS financial_roles_admin ON financial_roles;
DROP POLICY IF EXISTS financial_role_assignments_admin ON financial_role_assignments;
CREATE POLICY financial_roles_admin ON financial_roles FOR ALL USING (
  has_financial_permission('view_all_transactions')
);
CREATE POLICY financial_role_assignments_admin ON financial_role_assignments FOR ALL USING (
  has_financial_permission('view_all_transactions')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. SQL FUNCTIONS FOR DASHBOARDS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Regulatory summary
CREATE OR REPLACE FUNCTION get_regulatory_summary(p_start_date DATE, p_end_date DATE)
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_volume', COALESCE(SUM(amount), 0),
    'total_transactions', COUNT(*),
    'active_users', COUNT(DISTINCT user_id),
    'flagged_transactions', 0,
    'avg_transaction_size', COALESCE(AVG(amount), 0),
    'pending_flags', 0,
    'critical_flags', 0,
    'period_start', p_start_date,
    'period_end', p_end_date
  ) INTO result
  FROM transactions
  WHERE created_at >= p_start_date AND created_at < (p_end_date + INTERVAL '1 day');
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fraud metrics
CREATE OR REPLACE FUNCTION get_fraud_metrics(p_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_flags', COUNT(*),
    'open_flags', COUNT(*) FILTER (WHERE status = 'open'),
    'resolved_flags', COUNT(*) FILTER (WHERE status = 'resolved'),
    'false_positives', COUNT(*) FILTER (WHERE status = 'false_positive'),
    'by_severity', jsonb_build_object(
      'critical', COUNT(*) FILTER (WHERE severity = 'critical'),
      'high', COUNT(*) FILTER (WHERE severity = 'high'),
      'medium', COUNT(*) FILTER (WHERE severity = 'medium'),
      'low', COUNT(*) FILTER (WHERE severity = 'low')
    ),
    'by_type', COALESCE((SELECT jsonb_object_agg(flag_type, cnt) FROM (
      SELECT flag_type, COUNT(*) as cnt FROM regulatory_flags
      WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL GROUP BY flag_type
    ) sub), '{}'::jsonb),
    'avg_resolution_time_hours', COALESCE((
      SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600)
      FROM regulatory_flags WHERE reviewed_at IS NOT NULL
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    ), 0)
  ) INTO result
  FROM regulatory_flags
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CBK report data
CREATE OR REPLACE FUNCTION get_cbk_report_data(p_period DATE)
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'period', p_period,
    'total_transactions', COUNT(*),
    'total_value', COALESCE(SUM(amount), 0),
    'successful_transactions', COUNT(*) FILTER (WHERE status = 'completed'),
    'failed_transactions', COUNT(*) FILTER (WHERE status = 'failed'),
    'avg_transaction_value', COALESCE(AVG(amount), 0),
    'unique_users', COUNT(DISTINCT user_id),
    'new_users', 0,
    'fraud_incidents', (SELECT COUNT(*) FROM regulatory_flags WHERE created_at >= p_period AND created_at < p_period + INTERVAL '1 month'),
    'system_uptime_percent', 99.9
  ) INTO result
  FROM transactions
  WHERE created_at >= p_period AND created_at < p_period + INTERVAL '1 month';
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create regulatory flag on suspicious transaction
CREATE OR REPLACE FUNCTION fn_auto_flag_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount > 1000000 THEN
    INSERT INTO regulatory_flags (transaction_id, user_id, flag_type, severity, description, risk_score, evidence)
    VALUES (NEW.id, NEW.user_id, 'amount', 'high',
      'Large transaction: ' || NEW.amount || ' ' || NEW.currency,
      LEAST(50 + (NEW.amount / 100000), 100),
      jsonb_build_object('amount', NEW.amount, 'currency', NEW.currency, 'threshold', 1000000));
  END IF;
  IF (SELECT COUNT(*) FROM transactions WHERE user_id = NEW.user_id AND created_at >= NOW() - INTERVAL '1 hour') > 5 THEN
    INSERT INTO regulatory_flags (transaction_id, user_id, flag_type, severity, description, risk_score, evidence)
    VALUES (NEW.id, NEW.user_id, 'velocity', 'medium',
      'High velocity: >5 transactions in 1 hour', 40,
      jsonb_build_object('hourly_count', (SELECT COUNT(*) FROM transactions WHERE user_id = NEW.user_id AND created_at >= NOW() - INTERVAL '1 hour')));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply auto-flag trigger (only if transactions table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_flag_transactions') THEN
      CREATE TRIGGER trg_auto_flag_transactions
      AFTER INSERT ON transactions
      FOR EACH ROW EXECUTE FUNCTION fn_auto_flag_transaction();
    END IF;
  END IF;
END $$;
