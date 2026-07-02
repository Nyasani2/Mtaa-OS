
-- ============================================
-- MTAA STREETS DATABASE SCHEMA (FIXED)
-- Creates streets_* tables to match frontend code
-- ============================================

-- 1. STREETS POSTS (main posts table - matches frontend expectations)
CREATE TABLE IF NOT EXISTS streets_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    caption TEXT,
    content TEXT,
    media_type TEXT DEFAULT 'text' CHECK (media_type IN ('image', 'video', 'text', 'poll', 'event', 'ad', 'product', 'live')),
    media_url TEXT,
    thumbnail_url TEXT,
    video_duration INTEGER,
    video_thumbnail_url TEXT,
    hashtags TEXT[] DEFAULT '{}',
    location TEXT,
    is_public BOOLEAN DEFAULT true,
    allow_comments BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. STREETS LIKES
CREATE TABLE IF NOT EXISTS streets_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES streets_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- 3. STREETS COMMENTS
CREATE TABLE IF NOT EXISTS streets_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES streets_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    parent_id UUID REFERENCES streets_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. STREETS COMMENT LIKES
CREATE TABLE IF NOT EXISTS streets_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES streets_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- 5. STREETS FOLLOWS
CREATE TABLE IF NOT EXISTS streets_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- 6. STREETS SAVES
CREATE TABLE IF NOT EXISTS streets_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES streets_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- 7. STREETS SHARES
CREATE TABLE IF NOT EXISTS streets_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES streets_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    platform TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. STREETS REPORTS
CREATE TABLE IF NOT EXISTS streets_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES streets_posts(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. STREETS NOTIFICATIONS
CREATE TABLE IF NOT EXISTS streets_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'like', 'comment', 'follow', 'gift', 'mention', 'monetization', 'wallet', 'system')),
    title TEXT NOT NULL,
    body TEXT,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name TEXT,
    post_id UUID,
    read BOOLEAN DEFAULT false,
    amount INTEGER,
    currency TEXT DEFAULT 'KES',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. STREETS HASHTAGS
CREATE TABLE IF NOT EXISTS streets_hashtags (
    tag TEXT PRIMARY KEY,
    count INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE streets_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_notifications ENABLE ROW LEVEL SECURITY;

-- Streets Posts Policies
CREATE POLICY "Posts viewable by everyone" ON streets_posts
    FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

CREATE POLICY "Users can create posts" ON streets_posts
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own posts" ON streets_posts
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own posts" ON streets_posts
    FOR DELETE USING (auth.uid() = creator_id);

-- Likes Policies
CREATE POLICY "Likes viewable by everyone" ON streets_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON streets_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON streets_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Comments viewable by everyone" ON streets_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON streets_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON streets_comments FOR DELETE USING (auth.uid() = user_id);

-- Follows Policies
CREATE POLICY "Follows viewable by everyone" ON streets_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON streets_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON streets_follows FOR DELETE USING (auth.uid() = follower_id);

-- Saves Policies
CREATE POLICY "Saves viewable by owner" ON streets_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save" ON streets_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave" ON streets_saves FOR DELETE USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Notifications viewable by recipient" ON streets_notifications
    FOR SELECT USING (auth.uid() = recipient_id);

-- Reports Policies
CREATE POLICY "Users can create reports" ON streets_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Increment post counts
CREATE OR REPLACE FUNCTION increment_streets_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'streets_likes' THEN
        UPDATE streets_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'streets_comments' THEN
        UPDATE streets_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'streets_shares' THEN
        UPDATE streets_posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Decrement post counts
CREATE OR REPLACE FUNCTION decrement_streets_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'streets_likes' THEN
        UPDATE streets_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'streets_comments' THEN
        UPDATE streets_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'streets_shares' THEN
        UPDATE streets_posts SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Update follower count
CREATE OR REPLACE FUNCTION update_streets_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET follower_count = COALESCE(follower_count, 0) + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET follower_count = GREATEST(0, COALESCE(follower_count, 0) - 1) WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create like notification
CREATE OR REPLACE FUNCTION create_streets_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    content_owner UUID;
    liker_name TEXT;
BEGIN
    SELECT creator_id INTO content_owner FROM streets_posts WHERE id = NEW.post_id;
    SELECT COALESCE(full_name, username, 'Someone') INTO liker_name FROM profiles WHERE id = NEW.user_id;

    IF content_owner IS NOT NULL AND content_owner != NEW.user_id THEN
        INSERT INTO streets_notifications (recipient_id, type, title, body, sender_id, sender_name, post_id)
        VALUES (content_owner, 'like', 'New Like', liker_name || ' liked your post', NEW.user_id, liker_name, NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create follow notification
CREATE OR REPLACE FUNCTION create_streets_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
    follower_name TEXT;
BEGIN
    SELECT COALESCE(full_name, username, 'Someone') INTO follower_name FROM profiles WHERE id = NEW.follower_id;

    INSERT INTO streets_notifications (recipient_id, type, title, body, sender_id, sender_name)
    VALUES (NEW.following_id, 'follow', 'New Follower', follower_name || ' started following you', NEW.follower_id, follower_name);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create comment notification
CREATE OR REPLACE FUNCTION create_streets_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    content_owner UUID;
    commenter_name TEXT;
BEGIN
    SELECT creator_id INTO content_owner FROM streets_posts WHERE id = NEW.post_id;
    SELECT COALESCE(full_name, username, 'Someone') INTO commenter_name FROM profiles WHERE id = NEW.user_id;

    IF content_owner IS NOT NULL AND content_owner != NEW.user_id THEN
        INSERT INTO streets_notifications (recipient_id, type, title, body, sender_id, sender_name, post_id)
        VALUES (content_owner, 'comment', 'New Comment', commenter_name || ' commented on your post', NEW.user_id, commenter_name, NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS streets_like_added ON streets_likes;
CREATE TRIGGER streets_like_added AFTER INSERT ON streets_likes
    FOR EACH ROW EXECUTE FUNCTION increment_streets_post_count();

DROP TRIGGER IF EXISTS streets_like_removed ON streets_likes;
CREATE TRIGGER streets_like_removed AFTER DELETE ON streets_likes
    FOR EACH ROW EXECUTE FUNCTION decrement_streets_post_count();

DROP TRIGGER IF EXISTS streets_comment_added ON streets_comments;
CREATE TRIGGER streets_comment_added AFTER INSERT ON streets_comments
    FOR EACH ROW EXECUTE FUNCTION increment_streets_post_count();

DROP TRIGGER IF EXISTS streets_comment_removed ON streets_comments;
CREATE TRIGGER streets_comment_removed AFTER DELETE ON streets_comments
    FOR EACH ROW EXECUTE FUNCTION decrement_streets_post_count();

DROP TRIGGER IF EXISTS streets_share_added ON streets_shares;
CREATE TRIGGER streets_share_added AFTER INSERT ON streets_shares
    FOR EACH ROW EXECUTE FUNCTION increment_streets_post_count();

DROP TRIGGER IF EXISTS streets_follow_count_update ON streets_follows;
CREATE TRIGGER streets_follow_count_update AFTER INSERT OR DELETE ON streets_follows
    FOR EACH ROW EXECUTE FUNCTION update_streets_follower_count();

DROP TRIGGER IF EXISTS streets_like_notification ON streets_likes;
CREATE TRIGGER streets_like_notification AFTER INSERT ON streets_likes
    FOR EACH ROW EXECUTE FUNCTION create_streets_like_notification();

DROP TRIGGER IF EXISTS streets_follow_notification ON streets_follows;
CREATE TRIGGER streets_follow_notification AFTER INSERT ON streets_follows
    FOR EACH ROW EXECUTE FUNCTION create_streets_follow_notification();

DROP TRIGGER IF EXISTS streets_comment_notification ON streets_comments;
CREATE TRIGGER streets_comment_notification AFTER INSERT ON streets_comments
    FOR EACH ROW EXECUTE FUNCTION create_streets_comment_notification();

-- Increment views function
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE streets_posts SET views_count = views_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Create via Supabase Dashboard:
-- Bucket: streets-images (public, image/*, 50MB)
-- Bucket: streets-videos (public, video/*, 100MB)
