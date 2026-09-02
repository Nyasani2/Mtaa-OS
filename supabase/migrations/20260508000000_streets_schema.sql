-- ============================================
-- MTAA STREETS DATABASE SCHEMA
-- Complete TikTok-like content platform
-- ============================================

-- 1. STREET CONTENT (main posts table)
CREATE TABLE IF NOT EXISTS street_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'image', 'text', 'poll', 'event', 'ad', 'product', 'service', 'live', 'repost')),
    media_urls TEXT[] DEFAULT '{}',
    caption TEXT,
    hashtags TEXT[] DEFAULT '{}',
    is_sponsored BOOLEAN DEFAULT false,
    sponsor_name TEXT,
    product_id UUID REFERENCES shops(id),
    job_id UUID REFERENCES jobs(id),
    live_room_id UUID,
    location TEXT,
    audience TEXT DEFAULT 'public' CHECK (audience IN ('public', 'followers', 'private')),
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    gifts_count INTEGER DEFAULT 0,
    is_live BOOLEAN DEFAULT false,
    original_content_id UUID REFERENCES street_content(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. STREET LIKES
CREATE TABLE IF NOT EXISTS street_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES street_content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(content_id, user_id)
);

-- 3. STREET COMMENTS
CREATE TABLE IF NOT EXISTS street_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES street_content(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT,
    text TEXT NOT NULL,
    parent_id UUID REFERENCES street_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. STREET COMMENT LIKES
CREATE TABLE IF NOT EXISTS street_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES street_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- 5. STREET FOLLOWS
CREATE TABLE IF NOT EXISTS street_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- 6. STREET SAVES
CREATE TABLE IF NOT EXISTS street_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES street_content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(content_id, user_id)
);

-- 7. STREET SHARES
CREATE TABLE IF NOT EXISTS street_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES street_content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    platform TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. STREET REPORTS
CREATE TABLE IF NOT EXISTS street_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES street_content(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. STREET HIDDEN (not interested)
CREATE TABLE IF NOT EXISTS street_hidden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES street_content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(content_id, user_id)
);

-- 10. STREET DRAFTS
CREATE TABLE IF NOT EXISTS street_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT,
    media_urls TEXT[] DEFAULT '{}',
    caption TEXT,
    hashtags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. STREET HASHTAGS
CREATE TABLE IF NOT EXISTS street_hashtags (
    tag TEXT PRIMARY KEY,
    count INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. LIVE ROOMS
CREATE TABLE IF NOT EXISTS live_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    host_name TEXT,
    title TEXT NOT NULL,
    viewer_count INTEGER DEFAULT 0,
    is_live BOOLEAN DEFAULT true,
    ticket_price INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT false,
    co_hosts UUID[] DEFAULT '{}',
    gifts_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- 13. LIVE MESSAGES
CREATE TABLE IF NOT EXISTS live_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES live_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT,
    text TEXT,
    gift_amount INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. LIVE HAND RAISES
CREATE TABLE IF NOT EXISTS live_hand_raises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES live_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'raised' CHECK (status IN ('raised', 'accepted', 'lowered')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. LIVE CO-HOST INVITES
CREATE TABLE IF NOT EXISTS live_co_host_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES live_rooms(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. STREET NOTIFICATIONS
CREATE TABLE IF NOT EXISTS street_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'like', 'comment', 'follow', 'gift', 'mention', 'monetization', 'wallet', 'system')),
    title TEXT NOT NULL,
    body TEXT,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name TEXT,
    content_id UUID,
    read BOOLEAN DEFAULT false,
    amount INTEGER,
    currency TEXT DEFAULT 'KES',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. STREET GIFTS
CREATE TABLE IF NOT EXISTS street_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES street_content(id) ON DELETE CASCADE,
    room_id UUID REFERENCES live_rooms(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'KES',
    gift_type TEXT DEFAULT 'generic',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE street_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_hidden ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_gifts ENABLE ROW LEVEL SECURITY;

-- Street Content Policies
CREATE POLICY "Content viewable by everyone" ON street_content
    FOR SELECT USING (
        status = 'published' AND (
            audience = 'public' OR
            (audience = 'followers' AND EXISTS (
                SELECT 1 FROM street_follows WHERE follower_id = auth.uid() AND following_id = user_id
            )) OR
            user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create content" ON street_content
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content" ON street_content
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content" ON street_content
    FOR DELETE USING (auth.uid() = user_id);

-- Likes Policies
CREATE POLICY "Likes viewable by everyone" ON street_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON street_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON street_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Comments viewable by everyone" ON street_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON street_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON street_comments FOR DELETE USING (auth.uid() = author_id);

-- Follows Policies
CREATE POLICY "Follows viewable by everyone" ON street_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON street_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON street_follows FOR DELETE USING (auth.uid() = follower_id);

-- Saves Policies
CREATE POLICY "Saves viewable by owner" ON street_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save" ON street_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave" ON street_saves FOR DELETE USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Notifications viewable by recipient" ON street_notifications
    FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "System can create notifications" ON street_notifications
    FOR INSERT WITH CHECK (true);

-- Live Rooms Policies
CREATE POLICY "Live rooms viewable by everyone" ON live_rooms FOR SELECT USING (true);
CREATE POLICY "Users can create live rooms" ON live_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update rooms" ON live_rooms FOR UPDATE USING (auth.uid() = host_id);

-- Gifts Policies
CREATE POLICY "Gifts viewable by participants" ON street_gifts
    FOR SELECT USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "Users can send gifts" ON street_gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Increment counts function
CREATE OR REPLACE FUNCTION increment_street_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'street_likes' THEN
        UPDATE street_content SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
    ELSIF TG_TABLE_NAME = 'street_comments' THEN
        UPDATE street_content SET comments_count = comments_count + 1 WHERE id = NEW.content_id;
    ELSIF TG_TABLE_NAME = 'street_shares' THEN
        UPDATE street_content SET shares_count = shares_count + 1 WHERE id = NEW.content_id;
    ELSIF TG_TABLE_NAME = 'street_gifts' THEN
        UPDATE street_content SET gifts_count = gifts_count + 1 WHERE id = NEW.content_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Decrement counts function
CREATE OR REPLACE FUNCTION decrement_street_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'street_likes' THEN
        UPDATE street_content SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.content_id;
    ELSIF TG_TABLE_NAME = 'street_comments' THEN
        UPDATE street_content SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.content_id;
    ELSIF TG_TABLE_NAME = 'street_shares' THEN
        UPDATE street_content SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.content_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Hashtag increment function
CREATE OR REPLACE FUNCTION increment_hashtag(tag_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO street_hashtags (tag, count) VALUES (tag_name, 1)
    ON CONFLICT (tag) DO UPDATE SET count = street_hashtags.count + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER street_like_added AFTER INSERT ON street_likes
    FOR EACH ROW EXECUTE FUNCTION increment_street_count();
CREATE TRIGGER street_like_removed AFTER DELETE ON street_likes
    FOR EACH ROW EXECUTE FUNCTION decrement_street_count();
CREATE TRIGGER street_comment_added AFTER INSERT ON street_comments
    FOR EACH ROW EXECUTE FUNCTION increment_street_count();
CREATE TRIGGER street_comment_removed AFTER DELETE ON street_comments
    FOR EACH ROW EXECUTE FUNCTION decrement_street_count();
CREATE TRIGGER street_share_added AFTER INSERT ON street_shares
    FOR EACH ROW EXECUTE FUNCTION increment_street_count();

-- Update follower count on profiles
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_count_update AFTER INSERT OR DELETE ON street_follows
    FOR EACH ROW EXECUTE FUNCTION update_follower_count();

-- Notification trigger for likes
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    content_owner UUID;
    liker_name TEXT;
BEGIN
    SELECT user_id INTO content_owner FROM street_content WHERE id = NEW.content_id;
    SELECT display_name INTO liker_name FROM profiles WHERE id = NEW.user_id;

    IF content_owner != NEW.user_id THEN
        INSERT INTO street_notifications (recipient_id, type, title, body, sender_id, sender_name, content_id)
        VALUES (content_owner, 'like', 'New Like', liker_name || ' liked your post', NEW.user_id, liker_name, NEW.content_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER like_notification AFTER INSERT ON street_likes
    FOR EACH ROW EXECUTE FUNCTION create_like_notification();

-- Notification trigger for follows
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
    follower_name TEXT;
BEGIN
    SELECT display_name INTO follower_name FROM profiles WHERE id = NEW.follower_id;

    INSERT INTO street_notifications (recipient_id, type, title, body, sender_id, sender_name)
    VALUES (NEW.following_id, 'follow', 'New Follower', follower_name || ' started following you', NEW.follower_id, follower_name);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_notification AFTER INSERT ON street_follows
    FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Create bucket via Supabase Dashboard or API:
-- Bucket name: street-content
-- Public: true
-- Allowed MIME types: image/*, video/*
-- File size limit: 100MB
