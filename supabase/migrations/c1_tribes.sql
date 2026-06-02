-- ============================================
-- C1 TRIBES MODULE — SQL CHUNK
-- Full rebuild — replaces any existing tribes tables
-- ============================================

-- Drop old tables if they exist (clean slate)
DROP TABLE IF EXISTS tribe_members CASCADE;
DROP TABLE IF EXISTS tribe_posts CASCADE;
DROP TABLE IF EXISTS tribe_events CASCADE;
DROP TABLE IF EXISTS tribe_donations CASCADE;
DROP TABLE IF EXISTS tribe_invites CASCADE;
DROP TABLE IF EXISTS tribe_categories CASCADE;
DROP TABLE IF EXISTS tribes CASCADE;

-- 1. Create tribes table
CREATE TABLE IF NOT EXISTS tribes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    category_id UUID,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_paid BOOLEAN DEFAULT FALSE,
    membership_fee NUMERIC(20, 2) DEFAULT 0,
    membership_currency TEXT DEFAULT 'KES',
    is_private BOOLEAN DEFAULT FALSE,
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    rules TEXT,
    location TEXT,
    tags TEXT[],
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create tribe_categories table
CREATE TABLE IF NOT EXISTS tribe_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create tribe_members table
CREATE TABLE IF NOT EXISTS tribe_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned', 'left')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    payment_status TEXT DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'paid', 'expired')),
    payment_expires_at TIMESTAMPTZ,
    UNIQUE(tribe_id, user_id)
);

-- 4. Create tribe_posts table
CREATE TABLE IF NOT EXISTS tribe_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'poll', 'event', 'announcement')),
    title TEXT,
    content TEXT NOT NULL,
    media_urls TEXT[],
    poll_options JSONB,
    poll_results JSONB,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'flagged')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create tribe_post_likes table
CREATE TABLE IF NOT EXISTS tribe_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES tribe_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 6. Create tribe_post_comments table
CREATE TABLE IF NOT EXISTS tribe_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES tribe_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES tribe_post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create tribe_events table
CREATE TABLE IF NOT EXISTS tribe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    is_online BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    max_attendees INTEGER,
    attendee_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create tribe_event_attendees table
CREATE TABLE IF NOT EXISTS tribe_event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES tribe_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going', 'attended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 9. Create tribe_donations table
CREATE TABLE IF NOT EXISTS tribe_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(20, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    message TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create tribe_invites table
CREATE TABLE IF NOT EXISTS tribe_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email TEXT,
    invitee_phone TEXT,
    invite_code TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Enable RLS
ALTER TABLE tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_invites ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies — tribes
CREATE POLICY "Tribes are viewable by all" ON tribes
    FOR SELECT USING (status = 'active');

CREATE POLICY "Creators can update their tribes" ON tribes
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their tribes" ON tribes
    FOR DELETE USING (creator_id = auth.uid());

CREATE POLICY "Authenticated users can create tribes" ON tribes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 13. RLS Policies — tribe_members
CREATE POLICY "Members can view their memberships" ON tribe_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join public tribes" ON tribe_members
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tribes t
            WHERE t.id = tribe_members.tribe_id
            AND t.is_private = FALSE
            AND t.status = 'active'
        )
    );

CREATE POLICY "Users can leave tribes" ON tribe_members
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage tribe members" ON tribe_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tribe_members tm
            WHERE tm.tribe_id = tribe_members.tribe_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('admin', 'moderator')
            AND tm.status = 'active'
        )
    );

-- 14. RLS Policies — tribe_posts
CREATE POLICY "Posts viewable by tribe members" ON tribe_posts
    FOR SELECT USING (
        status = 'published' AND
        EXISTS (
            SELECT 1 FROM tribe_members tm
            WHERE tm.tribe_id = tribe_posts.tribe_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

CREATE POLICY "Members can create posts" ON tribe_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tribe_members tm
            WHERE tm.tribe_id = tribe_posts.tribe_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

CREATE POLICY "Authors can update their posts" ON tribe_posts
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their posts" ON tribe_posts
    FOR DELETE USING (author_id = auth.uid());

-- 15. RLS Policies — tribe_post_likes
CREATE POLICY "Users can manage own likes" ON tribe_post_likes
    FOR ALL USING (user_id = auth.uid());

-- 16. RLS Policies — tribe_post_comments
CREATE POLICY "Comments viewable by tribe members" ON tribe_post_comments
    FOR SELECT USING (
        status = 'active' AND
        EXISTS (
            SELECT 1 FROM tribe_posts tp
            JOIN tribe_members tm ON tm.tribe_id = tp.tribe_id
            WHERE tp.id = tribe_post_comments.post_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

CREATE POLICY "Members can comment" ON tribe_post_comments
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tribe_posts tp
            JOIN tribe_members tm ON tm.tribe_id = tp.tribe_id
            WHERE tp.id = tribe_post_comments.post_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

CREATE POLICY "Authors can delete comments" ON tribe_post_comments
    FOR DELETE USING (author_id = auth.uid());

-- 17. RLS Policies — tribe_events
CREATE POLICY "Events viewable by tribe members" ON tribe_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tribe_members tm
            WHERE tm.tribe_id = tribe_events.tribe_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

CREATE POLICY "Members can create events" ON tribe_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tribe_members tm
            WHERE tm.tribe_id = tribe_events.tribe_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

-- 18. RLS Policies — tribe_event_attendees
CREATE POLICY "Users can manage own attendance" ON tribe_event_attendees
    FOR ALL USING (user_id = auth.uid());

-- 19. RLS Policies — tribe_donations
CREATE POLICY "Donors can view own donations" ON tribe_donations
    FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Tribe admins can view all donations" ON tribe_donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tribe_members tm
            WHERE tm.tribe_id = tribe_donations.tribe_id
            AND tm.user_id = auth.uid()
            AND tm.role = 'admin'
            AND tm.status = 'active'
        )
    );

CREATE POLICY "Users can donate" ON tribe_donations
    FOR INSERT WITH CHECK (donor_id = auth.uid());

-- 20. RLS Policies — tribe_invites
CREATE POLICY "Invites viewable by inviter or tribe admin" ON tribe_invites
    FOR SELECT USING (
        inviter_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM tribe_members tm
            WHERE tm.tribe_id = tribe_invites.tribe_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('admin', 'moderator')
            AND tm.status = 'active'
        )
    );

CREATE POLICY "Members can invite" ON tribe_invites
    FOR INSERT WITH CHECK (
        inviter_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tribe_members tm
            WHERE tm.tribe_id = tribe_invites.tribe_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

-- 21. Functions: Update tribe counters
CREATE OR REPLACE FUNCTION update_tribe_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE tribes SET member_count = member_count + 1 WHERE id = NEW.tribe_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
        UPDATE tribes SET member_count = GREATEST(0, member_count - 1) WHERE id = COALESCE(NEW.tribe_id, OLD.tribe_id);
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
        UPDATE tribes SET member_count = member_count + 1 WHERE id = NEW.tribe_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tribe_member_count_trigger ON tribe_members;
CREATE TRIGGER tribe_member_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tribe_members
    FOR EACH ROW
    EXECUTE FUNCTION update_tribe_member_count();

-- 22. Function: Update tribe post count
CREATE OR REPLACE FUNCTION update_tribe_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        UPDATE tribes SET post_count = post_count + 1 WHERE id = NEW.tribe_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status != 'published') THEN
        UPDATE tribes SET post_count = GREATEST(0, post_count - 1) WHERE id = COALESCE(NEW.tribe_id, OLD.tribe_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tribe_post_count_trigger ON tribe_posts;
CREATE TRIGGER tribe_post_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tribe_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_tribe_post_count();

-- 23. Function: Update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tribe_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tribe_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS post_like_count_trigger ON tribe_post_likes;
CREATE TRIGGER post_like_count_trigger
    AFTER INSERT OR DELETE ON tribe_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_like_count();

-- 24. Function: Update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE tribe_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
        UPDATE tribe_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS post_comment_count_trigger ON tribe_post_comments;
CREATE TRIGGER post_comment_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tribe_post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comment_count();

-- 25. Function: Update event attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'going' THEN
        UPDATE tribe_events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'going' AND NEW.status != 'going') THEN
        UPDATE tribe_events SET attendee_count = GREATEST(0, attendee_count - 1) WHERE id = COALESCE(NEW.event_id, OLD.event_id);
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'going' AND NEW.status = 'going' THEN
        UPDATE tribe_events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS event_attendee_count_trigger ON tribe_event_attendees;
CREATE TRIGGER event_attendee_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tribe_event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_event_attendee_count();

-- 26. Seed default categories
INSERT INTO tribe_categories (name, description, icon, sort_order) VALUES
('Business', 'Entrepreneurship, startups, and professional networking', '💼', 1),
('Technology', 'Tech discussions, coding, and innovation', '💻', 2),
('Health', 'Wellness, fitness, and mental health', '❤️', 3),
('Education', 'Learning, courses, and academic support', '📚', 4),
('Creative', 'Art, music, writing, and design', '🎨', 5),
('Community', 'Local groups, neighborhood, and social causes', '🏘️', 6),
('Faith', 'Religious and spiritual communities', '⛪', 7),
('Sports', 'Athletics, teams, and fitness groups', '⚽', 8),
('Finance', 'Investing, trading, and financial literacy', '💰', 9),
('Hobbies', 'Gaming, crafts, and leisure activities', '🎮', 10)
ON CONFLICT (name) DO NOTHING;

-- 27. Indexes
CREATE INDEX IF NOT EXISTS idx_tribes_category ON tribes(category_id);
CREATE INDEX IF NOT EXISTS idx_tribes_status ON tribes(status);
CREATE INDEX IF NOT EXISTS idx_tribe_members_tribe ON tribe_members(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribe_members_user ON tribe_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tribe_posts_tribe ON tribe_posts(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribe_posts_author ON tribe_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_tribe_posts_status ON tribe_posts(status);
CREATE INDEX IF NOT EXISTS idx_tribe_events_tribe ON tribe_events(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribe_donations_tribe ON tribe_donations(tribe_id);

-- 28. Grant permissions
GRANT ALL ON tribes TO authenticated;
GRANT ALL ON tribe_members TO authenticated;
GRANT ALL ON tribe_posts TO authenticated;
GRANT ALL ON tribe_post_likes TO authenticated;
GRANT ALL ON tribe_post_comments TO authenticated;
GRANT ALL ON tribe_events TO authenticated;
GRANT ALL ON tribe_event_attendees TO authenticated;
GRANT ALL ON tribe_donations TO authenticated;
GRANT ALL ON tribe_invites TO authenticated;
