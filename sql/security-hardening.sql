-- ═══════════════════════════════════════════════════════════════════════════════
-- MTAA Wallet Authentication Security Hardening — Production SQL
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this ENTIRE file in Supabase SQL Editor in order
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. USER_PROFILES SECURITY COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pin_hash TEXT,
ADD COLUMN IF NOT EXISTS pin_salt TEXT,
ADD COLUMN IF NOT EXISTS pin_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pin_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_ip INET,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS freeze_reason TEXT,
ADD COLUMN IF NOT EXISTS freeze_until TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. PIN HASHES TABLE (server-side canonical storage)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_pin_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'pbkdf2-sha256',
    iterations INTEGER NOT NULL DEFAULT 100000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_pin_hashes_user_id ON user_pin_hashes(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. PIN ATTEMPTS TABLE (rate limiting audit)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pin_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pin_attempts_user_device ON pin_attempts(user_id, device_id, created_at);
CREATE INDEX idx_pin_attempts_device_time ON pin_attempts(device_id, created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. PIN LOCKOUTS TABLE (active lockout tracking)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pin_lockouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL DEFAULT 'too_many_failed_attempts',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_pin_lockouts_user ON pin_lockouts(user_id, expires_at);
CREATE INDEX idx_pin_lockouts_device ON pin_lockouts(device_id, expires_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. DEVICE TRUST TABLE (device fingerprinting)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS device_trust (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    trust_score INTEGER NOT NULL DEFAULT 0,
    is_trusted BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_device BOOLEAN NOT NULL DEFAULT TRUE,
    biometric_enrolled BOOLEAN NOT NULL DEFAULT FALSE,
    biometric_type TEXT,
    enrolled_at TIMESTAMPTZ,
    last_verified TIMESTAMPTZ,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_device_trust_user ON device_trust(user_id, trust_score);
CREATE INDEX idx_device_trust_fingerprint ON device_trust(fingerprint);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. AUTH SESSIONS TABLE (server-side session tracking)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id, is_valid, expires_at);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(refresh_token_hash);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. AUTH AUDIT LOGS TABLE (comprehensive audit trail)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL DEFAULT 'auth',
    severity TEXT NOT NULL DEFAULT 'info',
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    device_id TEXT,
    session_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_user ON auth_audit_logs(user_id, created_at);
CREATE INDEX idx_auth_audit_event ON auth_audit_logs(event_type, created_at);
CREATE INDEX idx_auth_audit_severity ON auth_audit_logs(severity, created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. SECURITY EVENTS TABLE (real-time security monitoring)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    details JSONB,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_user ON security_events(user_id, resolved, created_at);
CREATE INDEX idx_security_events_type ON security_events(event_type, created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. WALLET SPENDING LIMITS TABLE (fraud prevention)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallet_spending_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    daily_limit NUMERIC NOT NULL DEFAULT 50000,
    weekly_limit NUMERIC NOT NULL DEFAULT 200000,
    monthly_limit NUMERIC NOT NULL DEFAULT 500000,
    single_transaction_limit NUMERIC NOT NULL DEFAULT 100000,
    cooling_off_minutes INTEGER NOT NULL DEFAULT 0,
    require_pin_above NUMERIC NOT NULL DEFAULT 1000,
    require_biometric_above NUMERIC NOT NULL DEFAULT 10000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. WALLET TRANSACTION RULES TABLE (velocity checks)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallet_transaction_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    max_transactions_per_hour INTEGER NOT NULL DEFAULT 10,
    max_transactions_per_day INTEGER NOT NULL DEFAULT 50,
    max_new_recipients_per_day INTEGER NOT NULL DEFAULT 5,
    block_international BOOLEAN NOT NULL DEFAULT TRUE,
    block_high_risk_countries BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. BACKUP CODES TABLE (account recovery)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_backup_codes_user ON user_backup_codes(user_id, used_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RPC FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Sync PIN hash to server
CREATE OR REPLACE FUNCTION sync_pin_hash(
    p_user_id UUID,
    p_pin_hash TEXT,
    p_salt TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_pin_hashes (user_id, pin_hash, salt)
    VALUES (p_user_id, p_pin_hash, p_salt)
    ON CONFLICT (user_id)
    DO UPDATE SET
        pin_hash = EXCLUDED.pin_hash,
        salt = EXCLUDED.salt,
        updated_at = NOW();

    -- Update user_profiles reference
    UPDATE user_profiles
    SET pin_hash = p_pin_hash,
        pin_salt = p_salt,
        pin_changed_at = NOW(),
        failed_pin_attempts = 0,
        pin_locked_until = NULL
    WHERE id = p_user_id;
END;
$$;

-- 2. Get device salt (for encryption key derivation)
CREATE OR REPLACE FUNCTION get_device_salt(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_salt TEXT;
BEGIN
    SELECT salt INTO v_salt FROM user_pin_hashes WHERE user_id = p_user_id;

    IF v_salt IS NULL THEN
        -- Generate new salt
        v_salt := encode(gen_random_bytes(32), 'hex');
        INSERT INTO user_pin_hashes (user_id, pin_hash, salt)
        VALUES (p_user_id, 'pending', v_salt)
        ON CONFLICT (user_id) DO UPDATE SET salt = EXCLUDED.salt;
    END IF;

    RETURN v_salt;
END;
$$;

-- 3. Calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(
    p_user_id UUID,
    p_device_id TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_score INTEGER := 0;
    v_device RECORD;
    v_session_count INTEGER;
    v_days_since_enrollment INTEGER;
BEGIN
    SELECT * INTO v_device FROM device_trust
    WHERE user_id = p_user_id AND device_id = p_device_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Base score for verified device
    IF v_device.is_trusted THEN
        v_score := v_score + 30;
    END IF;

    -- Biometric enrolled
    IF v_device.biometric_enrolled THEN
        v_score := v_score + 25;
    END IF;

    -- Device age (max 20 points for 30+ days)
    v_days_since_enrollment := EXTRACT(DAY FROM NOW() - v_device.enrolled_at);
    v_score := v_score + LEAST(20, v_days_since_enrollment);

    -- Session history (max 15 points for 10+ sessions)
    SELECT COUNT(*) INTO v_session_count
    FROM auth_sessions
    WHERE user_id = p_user_id AND device_id = p_device_id AND is_valid = TRUE;
    v_score := v_score + LEAST(15, v_session_count * 2);

    -- Penalty for failed attempts
    v_score := v_score - (v_device.failed_attempts * 10);

    -- Penalty for new device
    IF v_device.is_new_device THEN
        v_score := v_score - 20;
    END IF;

    RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;

-- 4. Revoke all sessions except current
CREATE OR REPLACE FUNCTION revoke_all_sessions_except_current(
    p_user_id UUID,
    p_current_session_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE auth_sessions
    SET is_valid = FALSE,
        revoked_at = NOW(),
        revoked_reason = 'password_changed'
    WHERE user_id = p_user_id
      AND id != p_current_session_id
      AND is_valid = TRUE;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Log security event
    INSERT INTO security_events (user_id, event_type, severity, details)
    VALUES (p_user_id, 'mass_session_revocation', 'high',
            jsonb_build_object('sessions_revoked', v_count, 'reason', 'password_changed'));

    RETURN v_count;
END;
$$;

-- 5. Check spending limit
CREATE OR REPLACE FUNCTION check_spending_limit(
    p_user_id UUID,
    p_amount NUMERIC,
    p_transaction_type TEXT
)
RETURNS TABLE(
    allowed BOOLEAN,
    reason TEXT,
    requires_step_up BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_limits RECORD;
    v_today_total NUMERIC;
    v_hour_count INTEGER;
    v_day_count INTEGER;
BEGIN
    -- Get user's spending limits
    SELECT * INTO v_limits FROM wallet_spending_limits WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        -- Create default limits
        INSERT INTO wallet_spending_limits (user_id) VALUES (p_user_id);
        SELECT * INTO v_limits FROM wallet_spending_limits WHERE user_id = p_user_id;
    END IF;

    -- Check single transaction limit
    IF p_amount > v_limits.single_transaction_limit THEN
        RETURN QUERY SELECT FALSE, 'Amount exceeds single transaction limit of KES ' || v_limits.single_transaction_limit, TRUE;
        RETURN;
    END IF;

    -- Check daily limit
    SELECT COALESCE(SUM(amount), 0) INTO v_today_total
    FROM wallet_transactions
    WHERE user_id = p_user_id
      AND type IN ('debit', 'transfer', 'payment')
      AND status = 'completed'
      AND DATE(created_at) = CURRENT_DATE;

    IF v_today_total + p_amount > v_limits.daily_limit THEN
        RETURN QUERY SELECT FALSE, 'Daily limit of KES ' || v_limits.daily_limit || ' exceeded. Spent today: KES ' || v_today_total, TRUE;
        RETURN;
    END IF;

    -- Check velocity (transactions per hour)
    SELECT COUNT(*) INTO v_hour_count
    FROM wallet_transactions
    WHERE user_id = p_user_id
      AND created_at > NOW() - INTERVAL '1 hour';

    SELECT COUNT(*) INTO v_day_count
    FROM wallet_transactions
    WHERE user_id = p_user_id
      AND DATE(created_at) = CURRENT_DATE;

    IF v_hour_count > 20 OR v_day_count > 100 THEN
        RETURN QUERY SELECT FALSE, 'Transaction velocity exceeded. Please wait before making another transaction.', TRUE;
        RETURN;
    END IF;

    -- Determine if step-up auth required
    RETURN QUERY SELECT TRUE, 'Transaction allowed', p_amount > v_limits.require_pin_above;
    RETURN;
END;
$$;

-- 6. Log auth audit event
CREATE OR REPLACE FUNCTION log_auth_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_severity TEXT DEFAULT 'info',
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO auth_audit_logs (user_id, event_type, severity, details, ip_address, user_agent, device_id)
    VALUES (p_user_id, p_event_type, p_severity, p_details, p_ip_address, p_user_agent, p_device_id)
    RETURNING id INTO v_id;

    -- Update user last activity
    UPDATE user_profiles
    SET last_login_at = NOW(),
        login_count = login_count + 1
    WHERE id = p_user_id;

    RETURN v_id;
END;
$$;

-- 7. Freeze account
CREATE OR REPLACE FUNCTION freeze_account(
    p_user_id UUID,
    p_reason TEXT,
    p_duration_hours INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_profiles
    SET account_frozen = TRUE,
        freeze_reason = p_reason,
        freeze_until = CASE WHEN p_duration_hours IS NOT NULL 
                           THEN NOW() + (p_duration_hours || ' hours')::INTERVAL 
                           ELSE NULL END
    WHERE id = p_user_id;

    -- Revoke all sessions
    UPDATE auth_sessions
    SET is_valid = FALSE,
        revoked_at = NOW(),
        revoked_reason = 'account_frozen'
    WHERE user_id = p_user_id AND is_valid = TRUE;

    -- Log event
    INSERT INTO security_events (user_id, event_type, severity, details)
    VALUES (p_user_id, 'account_frozen', 'critical',
            jsonb_build_object('reason', p_reason, 'duration_hours', p_duration_hours));
END;
$$;

-- 8. Unfreeze account
CREATE OR REPLACE FUNCTION unfreeze_account(p_user_id UUID, p_unfrozen_by UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_profiles
    SET account_frozen = FALSE,
        freeze_reason = NULL,
        freeze_until = NULL
    WHERE id = p_user_id;

    INSERT INTO security_events (user_id, event_type, severity, details)
    VALUES (p_user_id, 'account_unfrozen', 'high',
            jsonb_build_object('unfrozen_by', p_unfrozen_by));
END;
$$;

-- 9. Generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_codes TEXT[] := ARRAY[]::TEXT[];
    v_code TEXT;
    v_hash TEXT;
    i INTEGER;
BEGIN
    -- Delete old unused codes
    DELETE FROM user_backup_codes WHERE user_id = p_user_id AND used_at IS NULL;

    FOR i IN 1..10 LOOP
        v_code := upper(substring(md5(random()::text) from 1 for 4)) || '-' ||
                   upper(substring(md5(random()::text) from 1 for 4));
        v_hash := encode(digest(v_code, 'sha256'), 'hex');

        INSERT INTO user_backup_codes (user_id, code_hash, expires_at)
        VALUES (p_user_id, v_hash, NOW() + INTERVAL '1 year');

        v_codes := array_append(v_codes, v_code);
    END LOOP;

    RETURN v_codes;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all new tables
ALTER TABLE user_pin_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_trust ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_spending_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transaction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backup_codes ENABLE ROW LEVEL SECURITY;

-- user_pin_hashes: users can only see their own
CREATE POLICY "Users can only see their own PIN hash"
    ON user_pin_hashes FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can only update their own PIN hash"
    ON user_pin_hashes FOR UPDATE
    USING (user_id = auth.uid());

-- pin_attempts: users can see their own attempts
CREATE POLICY "Users can see their own PIN attempts"
    ON pin_attempts FOR SELECT
    USING (user_id = auth.uid());

-- device_trust: users can see their own devices
CREATE POLICY "Users can see their own device trust"
    ON device_trust FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own device trust"
    ON device_trust FOR UPDATE
    USING (user_id = auth.uid());

-- auth_sessions: users can see their own sessions
CREATE POLICY "Users can see their own sessions"
    ON auth_sessions FOR SELECT
    USING (user_id = auth.uid());

-- auth_audit_logs: users can see their own logs
CREATE POLICY "Users can see their own audit logs"
    ON auth_audit_logs FOR SELECT
    USING (user_id = auth.uid());

-- security_events: users can see their own events
CREATE POLICY "Users can see their own security events"
    ON security_events FOR SELECT
    USING (user_id = auth.uid());

-- wallet_spending_limits: users can see/update their own
CREATE POLICY "Users can manage their own spending limits"
    ON wallet_spending_limits FOR ALL
    USING (user_id = auth.uid());

-- wallet_transaction_rules: users can see their own rules
CREATE POLICY "Users can see their own transaction rules"
    ON wallet_transaction_rules FOR SELECT
    USING (user_id = auth.uid());

-- user_backup_codes: users can see their own (but not the hash)
CREATE POLICY "Users can see their own backup codes"
    ON user_backup_codes FOR SELECT
    USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at on device_trust
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_device_trust_updated_at
    BEFORE UPDATE ON device_trust
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_spending_limits_updated_at
    BEFORE UPDATE ON wallet_spending_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transaction_rules_updated_at
    BEFORE UPDATE ON wallet_transaction_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create spending limits and transaction rules for new users
CREATE OR REPLACE FUNCTION create_user_security_defaults()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallet_spending_limits (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO wallet_transaction_rules (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_security_defaults_trigger
    AFTER INSERT ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION create_user_security_defaults();

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'MTAA Wallet Authentication Security Hardening SQL applied successfully' AS status;
