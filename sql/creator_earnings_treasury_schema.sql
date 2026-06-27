-- ============================================================================
-- MTAA CREATOR EARNINGS → TREASURY WIRING
-- Routes all creator revenue to Treasury for sovereign financial tracking
-- ============================================================================

-- 1. CREATOR EARNINGS TABLE (aggregates all revenue streams)
CREATE TABLE IF NOT EXISTS creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Revenue source
    source_type TEXT NOT NULL CHECK (source_type IN (
        'streets_tip', 'streets_subscription', 'streets_premium',
        'mtaxi_fare', 'mtaxi_bonus', 'mtaxi_incentive',
        'mtruck_haul', 'mtruck_bonus',
        'shop_sale', 'shop_subscription',
        'marketplace_sale', 'marketplace_commission',
        'job_service', 'job_freelance', 'job_contract',
        'business_service', 'business_product', 'business_appointment',
        'property_rental', 'property_sale', 'property_booking',
        'restaurant_order', 'restaurant_reservation',
        'education_course', 'education_tutoring',
        'tribe_subscription', 'tribe_donation',
        'live_stream_tip', 'live_stream_subscription',
        'brand_collaboration', 'sponsorship',
        'referral_bonus', 'affiliate_commission',
        'wallet_reward', 'wallet_cashback',
        'other'
    )),
    source_id UUID, -- ID of the source record (tip_id, order_id, etc.)
    source_module TEXT NOT NULL, -- 'streets', 'mtaxi', 'shop', etc.

    -- Financials
    gross_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    platform_fee DECIMAL(15,2) NOT NULL DEFAULT 0, -- MTAA platform fee (e.g., 10%)
    tax_withheld DECIMAL(15,2) NOT NULL DEFAULT 0, -- Withholding tax
    processing_fee DECIMAL(15,2) NOT NULL DEFAULT 0, -- Payment processor fee
    net_amount DECIMAL(15,2) NOT NULL DEFAULT 0, -- What creator actually gets
    currency TEXT DEFAULT 'KES',

    -- Treasury routing
    treasury_account_id UUID REFERENCES treasury_accounts(id) ON DELETE SET NULL,
    treasury_voucher_id UUID, -- Links to treasury_expenditures when paid out
    routed_to_treasury BOOLEAN DEFAULT false,
    routed_at TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawn', 'held', 'disputed', 'refunded')),
    available_at TIMESTAMPTZ, -- When funds become available for withdrawal
    withdrawn_at TIMESTAMPTZ,

    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_earnings_profile ON creator_earnings(profile_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_user ON creator_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_source ON creator_earnings(source_type, source_module);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_status ON creator_earnings(status);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_available ON creator_earnings(available_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_creator_earnings_treasury ON creator_earnings(treasury_account_id) WHERE routed_to_treasury = true;

ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_earnings_select_own" ON creator_earnings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "creator_earnings_insert_system" ON creator_earnings
    FOR INSERT WITH CHECK (true); -- System/edge functions only

CREATE POLICY "creator_earnings_update_own" ON creator_earnings
    FOR UPDATE USING (user_id = auth.uid());

-- 2. CREATOR EARNINGS SUMMARY (materialized view for fast dashboard queries)
CREATE OR REPLACE VIEW creator_earnings_summary AS
SELECT 
    profile_id,
    user_id,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'available') as available_count,
    COUNT(*) FILTER (WHERE status = 'withdrawn') as withdrawn_count,
    COALESCE(SUM(gross_amount) FILTER (WHERE status IN ('pending', 'available')), 0) as total_gross,
    COALESCE(SUM(net_amount) FILTER (WHERE status = 'available'), 0) as available_balance,
    COALESCE(SUM(net_amount) FILTER (WHERE status = 'withdrawn'), 0) as total_withdrawn,
    COALESCE(SUM(platform_fee), 0) as total_platform_fees,
    COALESCE(SUM(tax_withheld), 0) as total_tax_withheld,
    MAX(created_at) as last_earning_at,
    jsonb_object_agg(source_module, cnt) FILTER (WHERE cnt > 0) as earnings_by_module
FROM (
    SELECT *, COUNT(*) OVER (PARTITION BY source_module) as cnt
    FROM creator_earnings
) sub
GROUP BY profile_id, user_id;

-- 3. CREATOR WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS creator_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'KES',
    fee DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,

    -- Destination
    destination_type TEXT NOT NULL CHECK (destination_type IN ('wallet', 'bank', 'mobile_money', 'crypto')),
    destination_details JSONB NOT NULL, -- {wallet_id, bank_account, mpesa_number, crypto_address}

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    processed_at TIMESTAMPTZ,
    processed_by UUID,
    failure_reason TEXT,

    -- Treasury link
    treasury_expenditure_id UUID REFERENCES treasury_expenditures(id) ON DELETE SET NULL,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_withdrawals_profile ON creator_withdrawals(profile_id);
CREATE INDEX IF NOT EXISTS idx_creator_withdrawals_status ON creator_withdrawals(status);

ALTER TABLE creator_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_withdrawals_select_own" ON creator_withdrawals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "creator_withdrawals_insert_own" ON creator_withdrawals
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. TRIGGER: Auto-calculate net_amount
CREATE OR REPLACE FUNCTION calculate_creator_earning_net()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_amount := NEW.gross_amount - NEW.platform_fee - NEW.tax_withheld - NEW.processing_fee;
    NEW.available_at := NEW.created_at + INTERVAL '7 days'; -- 7-day hold period
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_creator_earning_net ON creator_earnings;
CREATE TRIGGER trg_calculate_creator_earning_net
    BEFORE INSERT OR UPDATE ON creator_earnings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_creator_earning_net();

-- 5. TRIGGER: Route to Treasury when status changes to 'available'
CREATE OR REPLACE FUNCTION route_earning_to_treasury()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'available' AND OLD.status != 'available' AND NEW.routed_to_treasury = false THEN
        -- Create treasury expenditure record
        INSERT INTO treasury_expenditures (
            country_code, voucher_number, budget_id, account_id,
            payee_name, payee_type, payee_account,
            description, gross_amount, net_amount,
            payment_method, payment_status,
            metadata
        )
        SELECT 
            'KE',
            'MTAA-CR-' || NEW.id::text,
            b.id,
            a.id,
            p.display_name || ' (Creator)',
            'creator',
            w.wallet_address,
            'Creator earning: ' || NEW.source_type || ' from ' || NEW.source_module,
            NEW.gross_amount,
            NEW.net_amount,
            'wallet',
            'pending',
            jsonb_build_object(
                'creator_earning_id', NEW.id,
                'source_type', NEW.source_type,
                'source_module', NEW.source_module,
                'profile_id', NEW.profile_id
            )
        FROM profiles p
        LEFT JOIN wallets w ON w.user_id = NEW.user_id
        LEFT JOIN treasury_accounts a ON a.account_code = 'CREATOR_PAYOUTS' AND a.fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)
        LEFT JOIN treasury_budgets b ON b.budget_code = 'CREATOR_REWARDS' AND b.fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)
        WHERE p.id = NEW.profile_id;

        NEW.routed_to_treasury := true;
        NEW.routed_at := now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_route_earning_to_treasury ON creator_earnings;
CREATE TRIGGER trg_route_earning_to_treasury
    AFTER UPDATE ON creator_earnings
    FOR EACH ROW
    WHEN (NEW.status = 'available' AND OLD.status != 'available')
    EXECUTE FUNCTION route_earning_to_treasury();

-- 6. FUNCTION: Get creator earnings summary
CREATE OR REPLACE FUNCTION get_creator_earnings_summary(p_user_id UUID)
RETURNS TABLE (
    total_gross DECIMAL,
    total_net DECIMAL,
    available_balance DECIMAL,
    total_withdrawn DECIMAL,
    pending_count BIGINT,
    available_count BIGINT,
    withdrawn_count BIGINT,
    last_earning_at TIMESTAMPTZ,
    earnings_by_module JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ce.gross_amount), 0),
        COALESCE(SUM(ce.net_amount), 0),
        COALESCE(SUM(ce.net_amount) FILTER (WHERE ce.status = 'available'), 0),
        COALESCE(SUM(ce.net_amount) FILTER (WHERE ce.status = 'withdrawn'), 0),
        COUNT(*) FILTER (WHERE ce.status = 'pending'),
        COUNT(*) FILTER (WHERE ce.status = 'available'),
        COUNT(*) FILTER (WHERE ce.status = 'withdrawn'),
        MAX(ce.created_at),
        jsonb_object_agg(ce.source_module, COALESCE(sub.module_total, 0)) FILTER (WHERE sub.module_total > 0)
    FROM creator_earnings ce
    LEFT JOIN (
        SELECT source_module, SUM(net_amount) as module_total
        FROM creator_earnings
        WHERE user_id = p_user_id
        GROUP BY source_module
    ) sub ON sub.source_module = ce.source_module
    WHERE ce.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure Treasury accounts exist for creator payouts
INSERT INTO treasury_accounts (account_code, account_name, account_type, fiscal_year, opening_balance, current_balance, budget_approved)
VALUES 
    ('CREATOR_PAYOUTS', 'Creator Payouts Account', 'development', EXTRACT(YEAR FROM CURRENT_DATE)::int, 0, 0, 100000000),
    ('PLATFORM_REVENUE', 'Platform Revenue Account', 'recurrent', EXTRACT(YEAR FROM CURRENT_DATE)::int, 0, 0, 500000000)
ON CONFLICT (country_code, account_code, fiscal_year) DO NOTHING;

INSERT INTO treasury_budgets (budget_code, budget_name, budget_type, fiscal_year, approved_amount, account_id)
SELECT 
    'CREATOR_REWARDS', 'Creator Rewards & Incentives', 'development', EXTRACT(YEAR FROM CURRENT_DATE)::int, 100000000, id
FROM treasury_accounts 
WHERE account_code = 'CREATOR_PAYOUTS' AND fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)::int
ON CONFLICT DO NOTHING;
