-- ============================================================================
-- MTAA PROFILE OS — SAFE MIGRATION v2
-- ============================================================================
-- Schema confirmed: profiles.id = PK, profiles.user_id = FK → auth.users
-- profile_connections = follow system, profile_analytics = daily aggregates
-- ============================================================================

-- SECTION 1: ADD MISSING COLUMNS TO profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'mtaa_id') THEN
        ALTER TABLE public.profiles ADD COLUMN mtaa_id TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'online_status') THEN
        ALTER TABLE public.profiles ADD COLUMN online_status TEXT DEFAULT 'offline' CHECK (online_status IN ('online', 'away', 'offline', 'invisible'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trust_score') THEN
        ALTER TABLE public.profiles ADD COLUMN trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'completion_percentage') THEN
        ALTER TABLE public.profiles ADD COLUMN completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'languages') THEN
        ALTER TABLE public.profiles ADD COLUMN languages TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_say'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'slug') THEN
        ALTER TABLE public.profiles ADD COLUMN slug TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE public.profiles ADD COLUMN website TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'social_links') THEN
        ALTER TABLE public.profiles ADD COLUMN social_links JSONB DEFAULT '{}';
    END IF;
END $$;

-- SECTION 2: CREATE profile_views TABLE (Per-View Log)
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewer_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    source TEXT DEFAULT 'direct',
    metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_views_select_own" ON profile_views FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "profile_views_insert_anon" ON profile_views FOR INSERT WITH CHECK (true);

-- SECTION 3: CREATE profile_blocks TABLE
CREATE TABLE IF NOT EXISTS profile_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    blocker_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT,
    UNIQUE(blocker_profile_id, blocked_profile_id)
);
CREATE INDEX IF NOT EXISTS idx_profile_blocks_blocker ON profile_blocks(blocker_profile_id);
ALTER TABLE profile_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_blocks_select_own" ON profile_blocks FOR SELECT USING (blocker_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "profile_blocks_insert_own" ON profile_blocks FOR INSERT WITH CHECK (blocker_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "profile_blocks_delete_own" ON profile_blocks FOR DELETE USING (blocker_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- SECTION 4: CREATE profile_reports TABLE
CREATE TABLE IF NOT EXISTS profile_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reporter_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reported_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('spam', 'harassment', 'fake', 'inappropriate', 'scam', 'other')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    metadata JSONB DEFAULT '{}'
);
ALTER TABLE profile_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_reports_select_own" ON profile_reports FOR SELECT USING (reporter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "profile_reports_insert_own" ON profile_reports FOR INSERT WITH CHECK (reporter_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- SECTION 5: CREATE profile_subscriptions TABLE
CREATE TABLE IF NOT EXISTS profile_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    subscriber_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'basic',
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('weekly', 'monthly', 'yearly')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    expires_at TIMESTAMPTZ,
    UNIQUE(subscriber_profile_id, creator_profile_id)
);
ALTER TABLE profile_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_subscriptions_select_own" ON profile_subscriptions FOR SELECT USING (subscriber_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR creator_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- SECTION 6: CREATE profile_tips TABLE
CREATE TABLE IF NOT EXISTS profile_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    message TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}'
);
ALTER TABLE profile_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_tips_select_own" ON profile_tips FOR SELECT USING (sender_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR recipient_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "profile_tips_insert_own" ON profile_tips FOR INSERT WITH CHECK (sender_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- SECTION 7: FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_profile_stats(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile_id', p.id, 'display_name', p.display_name, 'username', p.username,
        'avatar_url', p.avatar_url, 'is_verified', p.is_verified,
        'follower_count', p.follower_count, 'following_count', p.following_count,
        'trust_score', p.trust_score, 'completion_percentage', p.completion_percentage,
        'online_status', p.online_status,
        'total_views', COALESCE((SELECT SUM(profile_views) FROM public.profile_analytics WHERE profile_id = p_profile_id), 0),
        'total_tips', COALESCE((SELECT SUM(amount) FROM public.profile_tips WHERE recipient_profile_id = p_profile_id AND status = 'completed'), 0),
        'total_subscribers', (SELECT COUNT(*) FROM public.profile_subscriptions WHERE creator_profile_id = p_profile_id AND status = 'active'),
        'is_blocked_by_me', EXISTS(SELECT 1 FROM public.profile_blocks WHERE blocker_profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND blocked_profile_id = p_profile_id),
        'is_following_me', EXISTS(SELECT 1 FROM public.profile_connections WHERE profile_id = p_profile_id AND connected_profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND status = 'active')
    ) INTO result FROM public.profiles p WHERE p.id = p_profile_id;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECTION 8: GENERATE MTAA IDs
UPDATE public.profiles SET mtaa_id = 'MTAA-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8)) WHERE mtaa_id IS NULL;
UPDATE public.profiles SET slug = COALESCE(username, 'user-' || SUBSTRING(id::text FROM 1 FOR 8)) WHERE slug IS NULL;
