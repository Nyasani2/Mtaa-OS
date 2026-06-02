-- ============================================================
-- RECEIVE MONEY / PAYMENT REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
    description TEXT,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_requester ON payment_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_payer ON payment_requests(payer_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters can manage their requests"
    ON payment_requests FOR ALL
    USING (auth.uid() = requester_id)
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Payers can view requests to them"
    ON payment_requests FOR SELECT
    USING (auth.uid() = payer_id OR auth.uid() = requester_id);

-- ============================================================
-- AGENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    agent_level INTEGER NOT NULL DEFAULT 1 CHECK (agent_level BETWEEN 1 AND 5),
    location TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    services TEXT[] DEFAULT '{}',
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    rating DECIMAL(2,1) DEFAULT 5.0,
    cash_float DECIMAL(12,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agents_location ON agents(lat, lng);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their agent profile"
    ON agents FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active agents"
    ON agents FOR SELECT
    USING (is_active = true);

-- ============================================================
-- BANK ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    branch TEXT,
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verification_method TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_default ON bank_accounts(is_default) WHERE is_default = true;

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their bank accounts"
    ON bank_accounts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SAVINGS ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    target_amount DECIMAL(12,2),
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_user ON savings_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_status ON savings_accounts(status);

ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their savings"
    ON savings_accounts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- LOANS
-- ============================================================
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 12.0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'repaid', 'defaulted', 'rejected')),
    purpose TEXT NOT NULL,
    approved_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    repaid_amount DECIMAL(12,2) DEFAULT 0,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their loans"
    ON loans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can apply for loans"
    ON loans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: updated_at for all new tables
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agents_updated_at ON agents;
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_savings_updated_at ON savings_accounts;
CREATE TRIGGER trg_savings_updated_at BEFORE UPDATE ON savings_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_loans_updated_at ON loans;
CREATE TRIGGER trg_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
