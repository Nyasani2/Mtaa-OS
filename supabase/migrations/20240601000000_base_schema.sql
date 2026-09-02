-- ============================================================
-- BASE SCHEMA — Must run FIRST before all other migrations
-- Creates: profiles, wallet_transactions, counties
-- These tables are referenced by nearly every other migration
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (The root of MTAA identity)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic identity
    display_name TEXT,
    username TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    cover_photo_url TEXT,
    bio TEXT,

    -- Location
    city TEXT,
    country TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),

    -- Professional
    profession TEXT,
    skills TEXT[],
    experience_years INTEGER,

    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'unverified',
    kyc_level INTEGER DEFAULT 0,
    kyc_verified_at TIMESTAMPTZ,

    -- Role & permissions
    role TEXT DEFAULT 'user',

    -- Social
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,

    -- Search
    search_vector TSVECTOR,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Trigger: auto-create profile on auth.user insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. COUNTIES TABLE (Referenced by governance, streets, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.counties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    country TEXT DEFAULT 'Kenya',
    capital TEXT,
    population INTEGER,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    geometry JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_counties_name ON public.counties(name);
CREATE INDEX IF NOT EXISTS idx_counties_code ON public.counties(code);

ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Counties are viewable by everyone"
    ON public.counties FOR SELECT
    TO anon, authenticated
    USING (true);

-- Seed Kenya counties
INSERT INTO public.counties (name, code, country) VALUES
('Mombasa', '001', 'Kenya'),
('Kwale', '002', 'Kenya'),
('Kilifi', '003', 'Kenya'),
('Tana River', '004', 'Kenya'),
('Lamu', '005', 'Kenya'),
('Taita Taveta', '006', 'Kenya'),
('Garissa', '007', 'Kenya'),
('Wajir', '008', 'Kenya'),
('Mandera', '009', 'Kenya'),
('Marsabit', '010', 'Kenya'),
('Isiolo', '011', 'Kenya'),
('Meru', '012', 'Kenya'),
('Tharaka-Nithi', '013', 'Kenya'),
('Embu', '014', 'Kenya'),
('Kitui', '015', 'Kenya'),
('Machakos', '016', 'Kenya'),
('Makueni', '017', 'Kenya'),
('Nyandarua', '018', 'Kenya'),
('Nyeri', '019', 'Kenya'),
('Kirinyaga', '020', 'Kenya'),
('Murang''a', '021', 'Kenya'),
('Kiambu', '022', 'Kenya'),
('Turkana', '023', 'Kenya'),
('West Pokot', '024', 'Kenya'),
('Samburu', '025', 'Kenya'),
('Trans Nzoia', '026', 'Kenya'),
('Uasin Gishu', '027', 'Kenya'),
('Elgeyo-Marakwet', '028', 'Kenya'),
('Nandi', '029', 'Kenya'),
('Baringo', '030', 'Kenya'),
('Laikipia', '031', 'Kenya'),
('Nakuru', '032', 'Kenya'),
('Narok', '033', 'Kenya'),
('Kajiado', '034', 'Kenya'),
('Kericho', '035', 'Kenya'),
('Bomet', '036', 'Kenya'),
('Kakamega', '037', 'Kenya'),
('Vihiga', '038', 'Kenya'),
('Bungoma', '039', 'Kenya'),
('Busia', '040', 'Kenya'),
('Siaya', '041', 'Kenya'),
('Kisumu', '042', 'Kenya'),
('Homa Bay', '043', 'Kenya'),
('Migori', '044', 'Kenya'),
('Kisii', '045', 'Kenya'),
('Nyamira', '046', 'Kenya'),
('Nairobi', '047', 'Kenya')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. WALLET_TRANSACTIONS TABLE (Referenced by QR scans, escrow, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parties
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Transaction details
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'KES',
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'deposit', 'withdrawal', 'transfer', 'payment', 'refund', 
        'escrow_deposit', 'escrow_release', 'escrow_refund',
        'fee', 'commission', 'bonus', 'airtime', 'bill_payment'
    )),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'reversed')),

    -- References
    reference_code TEXT UNIQUE,
    description TEXT,
    metadata JSONB DEFAULT '{}',

    -- External payment
    external_provider TEXT,
    external_transaction_id TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- RLS context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_sender ON public.wallet_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_recipient ON public.wallet_transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON public.wallet_transactions(reference_code);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON public.wallet_transactions FOR SELECT
    TO authenticated
    USING (sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create transactions"
    ON public.wallet_transactions FOR INSERT
    TO authenticated
    WITH CHECK (sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- ============================================================
-- 4. WALLETS TABLE (User balances)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    balance DECIMAL(15,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'KES',

    -- Limits
    daily_limit DECIMAL(15,2) DEFAULT 100000.00,
    monthly_limit DECIMAL(15,2) DEFAULT 1000000.00,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_frozen BOOLEAN DEFAULT false,
    freeze_reason TEXT,

    -- Security
    pin_hash TEXT,
    last_pin_changed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_profile ON public.wallets(profile_id);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
    ON public.wallets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own wallet"
    ON public.wallets FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_wallets_updated_at ON public.wallets;
CREATE TRIGGER trg_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. APPSTORE APPS TABLE (Referenced by appstore seed migrations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appstore_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,

    -- Categorization
    category TEXT NOT NULL,
    subcategory TEXT,
    tags TEXT[],

    -- Media
    icon_url TEXT,
    screenshots TEXT[],

    -- Developer
    developer_id UUID REFERENCES public.profiles(id),
    developer_name TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published', 'suspended')),

    -- Pricing
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0.00,

    -- Stats
    install_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,

    -- Routing
    route_path TEXT,
    is_os_app BOOLEAN DEFAULT false,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_appstore_apps_slug ON public.appstore_apps(slug);
CREATE INDEX IF NOT EXISTS idx_appstore_apps_category ON public.appstore_apps(category);
CREATE INDEX IF NOT EXISTS idx_appstore_apps_status ON public.appstore_apps(status);

ALTER TABLE public.appstore_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published apps are viewable by everyone"
    ON public.appstore_apps FOR SELECT
    TO anon, authenticated
    USING (status = 'published' OR developer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Developers can manage own apps"
    ON public.appstore_apps FOR ALL
    TO authenticated
    USING (developer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    WITH CHECK (developer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- ============================================================
-- 6. APP INSTALLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_installs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES public.appstore_apps(id) ON DELETE CASCADE,
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    last_opened_at TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT false,
    pin_order INTEGER,
    notification_enabled BOOLEAN DEFAULT true,
    UNIQUE(user_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_app_installs_user ON public.app_installs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_installs_app ON public.app_installs(app_id);

ALTER TABLE public.app_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own installs"
    ON public.app_installs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own installs"
    ON public.app_installs FOR ALL
    TO authenticated
    USING (user_id = auth.uid());
