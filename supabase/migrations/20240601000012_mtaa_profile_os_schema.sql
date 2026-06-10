-- ============================================================================
-- MTAA Profile OS — Complete Database Schema
-- Phase 0: Chassis — All tables, enums, RLS, triggers, indexes
-- Run this in Supabase SQL Editor as a single transaction
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUMS
-- ============================================================================

-- Profile type enum
DO $$ BEGIN
    CREATE TYPE profile_type AS ENUM (
        'personal', 'professional', 'business', 'creator', 'merchant',
        'agent', 'developer', 'farmer', 'service_provider', 'community_leader',
        'tribe_elder', 'ngo', 'institution', 'school', 'hospital',
        'government', 'county'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Business type enum
DO $$ BEGIN
    CREATE TYPE business_type AS ENUM (
        'restaurant', 'shop', 'service', 'taxi', 'truck', 'agency',
        'store', 'brand', 'company', 'cooperative', 'hotel', 'clinic',
        'pharmacy', 'supermarket', 'butchery', 'bakery', 'bar', 'cafe'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Business status enum
DO $$ BEGIN
    CREATE TYPE business_status AS ENUM (
        'draft', 'pending', 'active', 'suspended', 'closed', 'under_review'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verification type enum
DO $$ BEGIN
    CREATE TYPE verification_type AS ENUM (
        'identity', 'address', 'business', 'professional', 'community',
        'government', 'phone', 'email', 'biometric'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verification status enum
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'pending', 'in_review', 'approved', 'rejected', 'expired', 'revoked'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Achievement type enum
DO $$ BEGIN
    CREATE TYPE achievement_type AS ENUM (
        'award', 'certificate', 'license', 'milestone', 'recognition',
        'completion', 'badge', 'ranking'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portfolio type enum
DO $$ BEGIN
    CREATE TYPE portfolio_type AS ENUM (
        'project', 'case_study', 'photo', 'video', 'document',
        'presentation', 'research', 'product', 'business', 'service',
        'event', 'community_project', 'article', 'podcast', 'livestream'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Connection type enum
DO $$ BEGIN
    CREATE TYPE connection_type AS ENUM (
        'follower', 'following', 'contact', 'client', 'supplier',
        'partner', 'colleague', 'mentor', 'mentee'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Staff role enum
DO $$ BEGIN
    CREATE TYPE staff_role AS ENUM (
        'owner', 'manager', 'admin', 'cashier', 'waiter', 'chef',
        'driver', 'dispatcher', 'agent', 'staff', 'supervisor',
        'accountant', 'marketing', 'support'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Staff status enum
DO $$ BEGIN
    CREATE TYPE staff_status AS ENUM (
        'active', 'inactive', 'suspended', 'terminated', 'on_leave'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Availability status enum
DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM (
        'available', 'busy', 'away', 'offline', 'do_not_disturb',
        'open_to_work', 'hiring', 'open_for_business'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 2: EXTEND EXISTING profiles TABLE
-- ============================================================================

-- Add missing columns to existing profiles table
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS short_bio TEXT,
    ADD COLUMN IF NOT EXISTS mission TEXT,
    ADD COLUMN IF NOT EXISTS vision TEXT,
    ADD COLUMN IF NOT EXISTS skills TEXT[],
    ADD COLUMN IF NOT EXISTS languages TEXT[],
    ADD COLUMN IF NOT EXISTS availability_status availability_status DEFAULT 'available',
    ADD COLUMN IF NOT EXISTS profession TEXT,
    ADD COLUMN IF NOT EXISTS specialties TEXT[],
    ADD COLUMN IF NOT EXISTS interests TEXT[],
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS profile_type profile_type DEFAULT 'personal',
    ADD COLUMN IF NOT EXISTS headline TEXT,
    ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
    ADD COLUMN IF NOT EXISTS education_level TEXT,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS allow_calls BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN(search_vector);

-- Update search vector trigger
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.display_name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.full_name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.bio, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.profession, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.short_bio, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.city, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.country, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.skills, ' '), '')), 'D') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.specialties, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_search ON profiles;
CREATE TRIGGER trigger_update_profile_search
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_search_vector();

-- Update existing rows
UPDATE profiles SET search_vector = 
    setweight(to_tsvector('simple', COALESCE(display_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(full_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(bio, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(profession, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(short_bio, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(city, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(country, '')), 'C')
WHERE search_vector IS NULL;

-- ============================================================================
-- SECTION 3: PROFILE ROLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_type profile_type NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id, role_type)
);

CREATE INDEX IF NOT EXISTS idx_profile_roles_profile ON profile_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_roles_type ON profile_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_profile_roles_active ON profile_roles(is_active);

ALTER TABLE profile_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_roles_select_own" ON profile_roles
    FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_roles_insert_own" ON profile_roles
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_roles_update_own" ON profile_roles
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_roles_delete_own" ON profile_roles
    FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 4: PROFILE VERIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    verification_type verification_type NOT NULL,
    status verification_status NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    expiry_date DATE,
    documents JSONB DEFAULT '[]',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id, verification_type, status) WHERE status IN ('pending', 'in_review', 'approved')
);

CREATE INDEX IF NOT EXISTS idx_profile_verifications_profile ON profile_verifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_verifications_type ON profile_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_profile_verifications_status ON profile_verifications(status);

ALTER TABLE profile_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_verifications_select_own" ON profile_verifications
    FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_verifications_insert_own" ON profile_verifications
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_verifications_update_own" ON profile_verifications
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 5: PROFILE REPUTATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_reputation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL DEFAULT 50 CHECK (overall_score >= 0 AND overall_score <= 100),
    verification_score INTEGER NOT NULL DEFAULT 0 CHECK (verification_score >= 0 AND verification_score <= 100),
    activity_score INTEGER NOT NULL DEFAULT 0 CHECK (activity_score >= 0 AND activity_score <= 100),
    business_score INTEGER NOT NULL DEFAULT 0 CHECK (business_score >= 0 AND business_score <= 100),
    community_score INTEGER NOT NULL DEFAULT 0 CHECK (community_score >= 0 AND community_score <= 100),
    job_score INTEGER NOT NULL DEFAULT 0 CHECK (job_score >= 0 AND job_score <= 100),
    service_score INTEGER NOT NULL DEFAULT 0 CHECK (service_score >= 0 AND service_score <= 100),
    reliability_score INTEGER NOT NULL DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    completed_jobs INTEGER NOT NULL DEFAULT 0,
    completed_orders INTEGER NOT NULL DEFAULT 0,
    positive_reviews INTEGER NOT NULL DEFAULT 0,
    negative_reviews INTEGER NOT NULL DEFAULT 0,
    neutral_reviews INTEGER NOT NULL DEFAULT 0,
    dispute_count INTEGER NOT NULL DEFAULT 0,
    dispute_resolved INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_reputation_profile ON profile_reputation(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_reputation_overall ON profile_reputation(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_profile_reputation_trust ON profile_reputation(trust_score DESC);

ALTER TABLE profile_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_reputation_select_all" ON profile_reputation
    FOR SELECT USING (true);

CREATE POLICY "profile_reputation_update_system" ON profile_reputation
    FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 6: PROFILE ACHIEVEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_type achievement_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    issuer TEXT,
    issue_date DATE,
    expiry_date DATE,
    verification_url TEXT,
    document_url TEXT,
    badge_image_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}',
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'connections', 'private'))
);

CREATE INDEX IF NOT EXISTS idx_profile_achievements_profile ON profile_achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_achievements_type ON profile_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_profile_achievements_verified ON profile_achievements(is_verified);

ALTER TABLE profile_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_achievements_select_public" ON profile_achievements
    FOR SELECT USING (
        visibility = 'public' OR
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        (visibility = 'connections' AND EXISTS (
            SELECT 1 FROM profile_connections 
            WHERE (profile_id = profile_achievements.profile_id AND connected_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
            OR (connected_profile_id = profile_achievements.profile_id AND profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
        ))
    );

CREATE POLICY "profile_achievements_insert_own" ON profile_achievements
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_achievements_update_own" ON profile_achievements
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_achievements_delete_own" ON profile_achievements
    FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 7: PROFILE PORTFOLIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    portfolio_type portfolio_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    media_urls TEXT[],
    thumbnail_url TEXT,
    external_links JSONB DEFAULT '[]',
    tags TEXT[],
    start_date DATE,
    end_date DATE,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_profile_portfolios_profile ON profile_portfolios(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_portfolios_type ON profile_portfolios(portfolio_type);
CREATE INDEX IF NOT EXISTS idx_profile_portfolios_featured ON profile_portfolios(is_featured) WHERE is_featured = true;

ALTER TABLE profile_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_portfolios_select_public" ON profile_portfolios
    FOR SELECT USING (is_public = true OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_portfolios_insert_own" ON profile_portfolios
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_portfolios_update_own" ON profile_portfolios
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_portfolios_delete_own" ON profile_portfolios
    FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 8: PROFILE PROJECTS (detailed portfolio items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    portfolio_id UUID REFERENCES profile_portfolios(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    role TEXT,
    client_name TEXT,
    client_url TEXT,
    technologies TEXT[],
    outcomes TEXT,
    metrics JSONB DEFAULT '{}',
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_profile_projects_portfolio ON profile_projects(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_profile_projects_profile ON profile_projects(profile_id);

ALTER TABLE profile_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_projects_select_public" ON profile_projects
    FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR EXISTS (
        SELECT 1 FROM profile_portfolios WHERE id = profile_projects.portfolio_id AND is_public = true
    ));

CREATE POLICY "profile_projects_insert_own" ON profile_projects
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_projects_update_own" ON profile_projects
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_projects_delete_own" ON profile_projects
    FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 9: PROFILE SKILLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    proficiency_level skill_level NOT NULL DEFAULT 'beginner',
    years_of_experience INTEGER,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    endorsed_by UUID[] DEFAULT '{}',
    endorsement_count INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_profile_skills_profile ON profile_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_name ON profile_skills(skill_name);

ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_skills_select_all" ON profile_skills
    FOR SELECT USING (true);

CREATE POLICY "profile_skills_insert_own" ON profile_skills
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_skills_update_own" ON profile_skills
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_skills_delete_own" ON profile_skills
    FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 10: PROFILE CERTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id TEXT,
    credential_url TEXT,
    document_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    skills TEXT[],
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_profile_certifications_profile ON profile_certifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_certifications_expiry ON profile_certifications(expiry_date) WHERE expiry_date IS NOT NULL;

ALTER TABLE profile_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_certifications_select_all" ON profile_certifications
    FOR SELECT USING (true);

CREATE POLICY "profile_certifications_insert_own" ON profile_certifications
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_certifications_update_own" ON profile_certifications
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_certifications_delete_own" ON profile_certifications
    FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 11: PROFILE REFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referrer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id, referrer_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_references_profile ON profile_references(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_references_referrer ON profile_references(referrer_profile_id);

ALTER TABLE profile_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_references_select_public" ON profile_references
    FOR SELECT USING (is_public = true OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_references_insert_own" ON profile_references
    FOR INSERT WITH CHECK (referrer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_references_update_own" ON profile_references
    FOR UPDATE USING (referrer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_references_delete_own" ON profile_references
    FOR DELETE USING (referrer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 12: PROFILE LINKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_profile_links_profile ON profile_links(profile_id);

ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_links_select_all" ON profile_links
    FOR SELECT USING (true);

CREATE POLICY "profile_links_insert_own" ON profile_links
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_links_update_own" ON profile_links
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_links_delete_own" ON profile_links
    FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 13: PROFILE CONNECTIONS (Network)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    connected_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    connection_type connection_type NOT NULL DEFAULT 'contact',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'blocked', 'removed')),
    initiated_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id, connected_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_connections_profile ON profile_connections(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_connections_connected ON profile_connections(connected_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_connections_type ON profile_connections(connection_type);

ALTER TABLE profile_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_connections_select_own" ON profile_connections
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        connected_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "profile_connections_insert_own" ON profile_connections
    FOR INSERT WITH CHECK (
        initiated_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "profile_connections_update_own" ON profile_connections
    FOR UPDATE USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        connected_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "profile_connections_delete_own" ON profile_connections
    FOR DELETE USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        connected_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================================================
-- SECTION 14: PROFILE QR CODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    qr_type TEXT NOT NULL CHECK (qr_type IN ('identity', 'contact', 'business', 'portfolio', 'payment', 'job', 'service')),
    qr_data TEXT NOT NULL,
    qr_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    scan_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id, qr_type)
);

CREATE INDEX IF NOT EXISTS idx_profile_qr_codes_profile ON profile_qr_codes(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_qr_codes_type ON profile_qr_codes(qr_type);

ALTER TABLE profile_qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_qr_codes_select_own" ON profile_qr_codes
    FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_qr_codes_insert_own" ON profile_qr_codes
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_qr_codes_update_own" ON profile_qr_codes
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_qr_codes_delete_own" ON profile_qr_codes
    FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 15: PROFILE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    profile_views INTEGER NOT NULL DEFAULT 0,
    portfolio_views INTEGER NOT NULL DEFAULT 0,
    business_views INTEGER NOT NULL DEFAULT 0,
    service_views INTEGER NOT NULL DEFAULT 0,
    product_views INTEGER NOT NULL DEFAULT 0,
    job_invitations INTEGER NOT NULL DEFAULT 0,
    service_requests INTEGER NOT NULL DEFAULT 0,
    product_sales INTEGER NOT NULL DEFAULT 0,
    community_reach INTEGER NOT NULL DEFAULT 0,
    revenue_generated NUMERIC(12,2) NOT NULL DEFAULT 0,
    new_followers INTEGER NOT NULL DEFAULT 0,
    new_connections INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_profile_analytics_profile_date ON profile_analytics(profile_id, date DESC);

ALTER TABLE profile_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_analytics_select_own" ON profile_analytics
    FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_analytics_insert_system" ON profile_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "profile_analytics_update_system" ON profile_analytics
    FOR UPDATE USING (true);

-- ============================================================================
-- SECTION 16: PROFILE SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_profile_public BOOLEAN NOT NULL DEFAULT true,
    is_portfolio_public BOOLEAN NOT NULL DEFAULT true,
    is_achievements_public BOOLEAN NOT NULL DEFAULT true,
    is_skills_public BOOLEAN NOT NULL DEFAULT true,
    allow_messages_from TEXT NOT NULL DEFAULT 'all' CHECK (allow_messages_from IN ('all', 'connections', 'none')),
    allow_calls_from TEXT NOT NULL DEFAULT 'none' CHECK (allow_calls_from IN ('all', 'connections', 'none')),
    show_email BOOLEAN NOT NULL DEFAULT false,
    show_phone BOOLEAN NOT NULL DEFAULT false,
    show_location BOOLEAN NOT NULL DEFAULT true,
    show_online_status BOOLEAN NOT NULL DEFAULT true,
    email_notifications JSONB DEFAULT '{"profile_views": true, "messages": true, "job_invites": true, "service_requests": true, "orders": true}',
    push_notifications JSONB DEFAULT '{"profile_views": false, "messages": true, "job_invites": true, "service_requests": true, "orders": true}',
    language TEXT NOT NULL DEFAULT 'en',
    timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    blocked_profiles UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_settings_profile ON profile_settings(profile_id);

ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_settings_select_own" ON profile_settings
    FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_settings_insert_own" ON profile_settings
    FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_settings_update_own" ON profile_settings
    FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 17: PROFILE ACTIVITY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_profile_activity_log_profile ON profile_activity_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_activity_log_created ON profile_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_activity_log_type ON profile_activity_log(activity_type);

ALTER TABLE profile_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_activity_log_select_own" ON profile_activity_log
    FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "profile_activity_log_insert_system" ON profile_activity_log
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SECTION 18: EXTEND BUSINESSES TABLE
-- ============================================================================

ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS business_type business_type,
    ADD COLUMN IF NOT EXISTS status business_status DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS tax_pin TEXT,
    ADD COLUMN IF NOT EXISTS registration_number TEXT,
    ADD COLUMN IF NOT EXISTS licenses JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS compliance_docs JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS cuisine_type TEXT,
    ADD COLUMN IF NOT EXISTS year_established INTEGER,
    ADD COLUMN IF NOT EXISTS employee_count INTEGER,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS amenities TEXT[],
    ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{"cash", "mpesa"}',
    ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS delivery_radius NUMERIC,
    ADD COLUMN IF NOT EXISTS minimum_order NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS banner_url TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_businesses_type ON businesses(business_type);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);

-- ============================================================================
-- SECTION 19: BUSINESS BRANCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_main_branch BOOLEAN NOT NULL DEFAULT false,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    region TEXT,
    country TEXT DEFAULT 'KE',
    postal_code TEXT,
    geo_location JSONB,
    phone TEXT,
    email TEXT,
    manager_id UUID REFERENCES profiles(id),
    operating_hours JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_business_branches_business ON business_branches(business_id);
CREATE INDEX IF NOT EXISTS idx_business_branches_main ON business_branches(business_id, is_main_branch) WHERE is_main_branch = true;

ALTER TABLE business_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_branches_select_all" ON business_branches
    FOR SELECT USING (true);

CREATE POLICY "business_branches_insert_owner" ON business_branches
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_branches.business_id AND owner_id = auth.uid())
    );

CREATE POLICY "business_branches_update_owner" ON business_branches
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_branches.business_id AND owner_id = auth.uid())
    );

CREATE POLICY "business_branches_delete_owner" ON business_branches
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_branches.business_id AND owner_id = auth.uid())
    );

-- ============================================================================
-- SECTION 20: PROFILE BUSINESSES (Junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    role staff_role NOT NULL DEFAULT 'owner',
    is_primary_owner BOOLEAN NOT NULL DEFAULT false,
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_businesses_profile ON profile_businesses(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_businesses_business ON profile_businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_profile_businesses_active ON profile_businesses(is_active) WHERE is_active = true;

ALTER TABLE profile_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_businesses_select_own" ON profile_businesses
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM businesses WHERE id = profile_businesses.business_id AND owner_id = auth.uid())
    );

CREATE POLICY "profile_businesses_insert_owner" ON profile_businesses
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM businesses WHERE id = profile_businesses.business_id AND owner_id = auth.uid())
    );

CREATE POLICY "profile_businesses_update_owner" ON profile_businesses
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM businesses WHERE id = profile_businesses.business_id AND owner_id = auth.uid()) OR
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "profile_businesses_delete_owner" ON profile_businesses
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM businesses WHERE id = profile_businesses.business_id AND owner_id = auth.uid())
    );

-- ============================================================================
-- SECTION 21: BUSINESS STAFF
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES business_branches(id) ON DELETE SET NULL,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role staff_role NOT NULL DEFAULT 'staff',
    status staff_status NOT NULL DEFAULT 'active',
    permissions JSONB DEFAULT '{}',
    hourly_rate NUMERIC(10,2),
    salary NUMERIC(12,2),
    commission_rate NUMERIC(5,2),
    start_date DATE,
    end_date DATE,
    invited_by UUID REFERENCES profiles(id),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    UNIQUE(business_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_business_staff_business ON business_staff(business_id);
CREATE INDEX IF NOT EXISTS idx_business_staff_profile ON business_staff(profile_id);
CREATE INDEX IF NOT EXISTS idx_business_staff_status ON business_staff(status);

ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_staff_select_all" ON business_staff
    FOR SELECT USING (true);

CREATE POLICY "business_staff_insert_owner" ON business_staff
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_staff.business_id AND owner_id = auth.uid())
    );

CREATE POLICY "business_staff_update_owner" ON business_staff
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_staff.business_id AND owner_id = auth.uid()) OR
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "business_staff_delete_owner" ON business_staff
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM businesses WHERE id = business_staff.business_id AND owner_id = auth.uid())
    );

-- ============================================================================
-- SECTION 22: TRIGGERS
-- ============================================================================

-- Auto-update updated_at on all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all new tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'profile_roles', 'profile_verifications', 'profile_reputation',
            'profile_achievements', 'profile_portfolios', 'profile_projects',
            'profile_skills', 'profile_certifications', 'profile_references',
            'profile_links', 'profile_connections', 'profile_qr_codes',
            'profile_analytics', 'profile_settings', 'profile_activity_log',
            'business_branches', 'profile_businesses', 'business_staff'
        )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %I;', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trigger_update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl, tbl);
    END LOOP;
END $$;

-- Auto-create profile_settings on profile creation
CREATE OR REPLACE FUNCTION create_profile_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profile_settings (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_profile_settings ON profiles;
CREATE TRIGGER trigger_create_profile_settings
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_settings();

-- Auto-create profile_reputation on profile creation
CREATE OR REPLACE FUNCTION create_profile_reputation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profile_reputation (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_profile_reputation ON profiles;
CREATE TRIGGER trigger_create_profile_reputation
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_reputation();

-- Auto-log profile activity
CREATE OR REPLACE FUNCTION log_profile_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profile_activity_log (profile_id, activity_type, activity_description, related_entity_type, related_entity_id)
    VALUES (NEW.profile_id, TG_TABLE_NAME || '_created', 'New ' || TG_TABLE_NAME || ' created', TG_TABLE_NAME, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 23: FUNCTIONS
-- ============================================================================

-- Calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    total INTEGER := 10;
    p RECORD;
BEGIN
    SELECT * INTO p FROM profiles WHERE id = p_id;
    IF p.avatar_url IS NOT NULL THEN score := score + 1; END IF;
    IF p.cover_photo_url IS NOT NULL THEN score := score + 1; END IF;
    IF p.bio IS NOT NULL AND length(p.bio) > 10 THEN score := score + 1; END IF;
    IF p.display_name IS NOT NULL THEN score := score + 1; END IF;
    IF p.phone IS NOT NULL THEN score := score + 1; END IF;
    IF p.city IS NOT NULL THEN score := score + 1; END IF;
    IF p.profession IS NOT NULL THEN score := score + 1; END IF;
    IF p.skills IS NOT NULL AND array_length(p.skills, 1) > 0 THEN score := score + 1; END IF;
    IF p.is_verified = true THEN score := score + 1; END IF;
    IF EXISTS (SELECT 1 FROM profile_portfolios WHERE profile_id = p_id) THEN score := score + 1; END IF;
    RETURN (score * 100) / total;
END;
$$ LANGUAGE plpgsql;

-- Update profile completeness trigger
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET profile_completeness = calculate_profile_completeness(NEW.id) WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_completeness ON profiles;
CREATE TRIGGER trigger_update_completeness
    AFTER UPDATE OF avatar_url, cover_photo_url, bio, display_name, phone, city, profession, skills, is_verified ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completeness();

-- Get public profile summary
CREATE OR REPLACE FUNCTION get_public_profile(p_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'display_name', p.display_name,
        'username', p.username,
        'avatar_url', p.avatar_url,
        'cover_photo_url', p.cover_photo_url,
        'bio', p.bio,
        'profession', p.profession,
        'city', p.city,
        'country', p.country,
        'skills', p.skills,
        'languages', p.languages,
        'is_verified', p.is_verified,
        'verification_level', p.verification_level,
        'trust_score', p.trust_score,
        'profile_completeness', p.profile_completeness,
        'availability_status', p.availability_status,
        'roles', (SELECT jsonb_agg(role_type) FROM profile_roles WHERE profile_id = p.id AND is_active = true),
        'reputation', (SELECT jsonb_build_object(
            'overall_score', overall_score,
            'trust_score', trust_score,
            'business_score', business_score,
            'community_score', community_score
        ) FROM profile_reputation WHERE profile_id = p.id),
        'portfolio_count', (SELECT count(*) FROM profile_portfolios WHERE profile_id = p.id AND is_public = true),
        'achievement_count', (SELECT count(*) FROM profile_achievements WHERE profile_id = p.id AND visibility = 'public'),
        'business_count', (SELECT count(*) FROM profile_businesses WHERE profile_id = p.id AND is_active = true),
        'connection_count', (SELECT count(*) FROM profile_connections WHERE profile_id = p.id AND status = 'active')
    ) INTO result
    FROM profiles p
    WHERE p.id = p_id AND p.is_public = true AND p.deleted_at IS NULL;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 24: SEED DATA
-- ============================================================================

-- Add business_owner and restaurant_owner to user_role enum if not exists
-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in transactions easily
-- Run this separately if needed:
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'business_owner';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'restaurant_owner';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'driver';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'merchant';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
