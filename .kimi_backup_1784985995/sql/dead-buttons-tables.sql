-- MTAA Dead Button Fix: SQL Tables & RLS Policies
-- Run this in Supabase SQL Editor

-- ─── 1. education_fee_payments ───
CREATE TABLE IF NOT EXISTS education_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID REFERENCES education_fees(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  student_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  term TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'wallet',
  transaction_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_education_fee_payments_fee ON education_fee_payments(fee_id);
CREATE INDEX IF NOT EXISTS idx_education_fee_payments_guardian ON education_fee_payments(guardian_id);

-- ─── 2. developer_applications ───
CREATE TABLE IF NOT EXISTS developer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_developer_applications_user ON developer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_developer_applications_status ON developer_applications(status);

-- ─── 3. developer_apps ───
CREATE TABLE IF NOT EXISTS developer_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'tools',
  price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  downloads INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  icon_url TEXT,
  screenshots JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_developer_apps_developer ON developer_apps(developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_apps_status ON developer_apps(status);

-- ─── 4. developer_earnings ───
CREATE TABLE IF NOT EXISTS developer_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC NOT NULL DEFAULT 0,
  pending_balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_developer_earnings_dev ON developer_earnings(developer_id);

-- ─── 5. security_scans ───
CREATE TABLE IF NOT EXISTS security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  threats_found INTEGER NOT NULL DEFAULT 0,
  issues JSONB DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_scans_user ON security_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_security_scans_created ON security_scans(created_at DESC);

-- ─── 6. health_insurance_policies ───
CREATE TABLE IF NOT EXISTS health_insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  policy_type TEXT NOT NULL DEFAULT 'individual' CHECK (policy_type IN ('individual', 'family', 'corporate')),
  coverage_type TEXT NOT NULL DEFAULT 'comprehensive' CHECK (coverage_type IN ('comprehensive', 'inpatient', 'outpatient')),
  premium_amount NUMERIC NOT NULL DEFAULT 0,
  coverage_limit NUMERIC NOT NULL DEFAULT 0,
  deductible NUMERIC NOT NULL DEFAULT 0,
  co_pay_percent NUMERIC NOT NULL DEFAULT 0,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_insurance_policies_user ON health_insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_policies_active ON health_insurance_policies(is_active);

-- ─── 7. health_insurance_claims ───
CREATE TABLE IF NOT EXISTS health_insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  policy_id UUID REFERENCES health_insurance_policies(id) ON DELETE SET NULL,
  claim_type TEXT NOT NULL,
  claim_amount NUMERIC NOT NULL DEFAULT 0,
  approved_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'settled')),
  facility TEXT,
  description TEXT,
  documents JSONB DEFAULT '[]',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_health_insurance_claims_user ON health_insurance_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_claims_status ON health_insurance_claims(status);

-- ─── 8. health_insurance_preauths ───
CREATE TABLE IF NOT EXISTS health_insurance_preauths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  policy_id UUID REFERENCES health_insurance_policies(id) ON DELETE SET NULL,
  procedure TEXT NOT NULL,
  facility TEXT NOT NULL,
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  approved_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response_notes TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_health_insurance_preauths_user ON health_insurance_preauths(user_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_preauths_status ON health_insurance_preauths(status);

-- ─── 9. auth_sessions (if not exists) ───
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_created ON auth_sessions(created_at DESC);

-- ─── 10. auth_audit_logs (if not exists) ───
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user ON auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_event ON auth_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_created ON auth_audit_logs(created_at DESC);

-- ─── RLS Policies ───

ALTER TABLE education_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurance_preauths ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users own fee payments" ON education_fee_payments FOR ALL USING (guardian_id = auth.uid());
CREATE POLICY "Users own dev applications" ON developer_applications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own dev apps" ON developer_apps FOR ALL USING (developer_id = auth.uid());
CREATE POLICY "Users own earnings" ON developer_earnings FOR ALL USING (developer_id = auth.uid());
CREATE POLICY "Users own security scans" ON security_scans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own insurance policies" ON health_insurance_policies FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own insurance claims" ON health_insurance_claims FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own preauths" ON health_insurance_preauths FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own sessions" ON auth_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own audit logs" ON auth_audit_logs FOR ALL USING (user_id = auth.uid());

-- ─── Add is_developer to user_profiles if missing ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_developer'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_developer BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'mfa_enabled'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'pin_hash'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN pin_hash TEXT;
  END IF;
END $$;

-- ─── Grant permissions ───
GRANT ALL ON education_fee_payments TO authenticated;
GRANT ALL ON developer_applications TO authenticated;
GRANT ALL ON developer_apps TO authenticated;
GRANT ALL ON developer_earnings TO authenticated;
GRANT ALL ON security_scans TO authenticated;
GRANT ALL ON health_insurance_policies TO authenticated;
GRANT ALL ON health_insurance_claims TO authenticated;
GRANT ALL ON health_insurance_preauths TO authenticated;
GRANT ALL ON auth_sessions TO authenticated;
GRANT ALL ON auth_audit_logs TO authenticated;
