-- ============================================
-- TRIBES MODULE SCHEMA
-- ============================================

CREATE TABLE IF NOT EXISTS tribes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('ethnic','interest','heritage','profession','location','vehicle','brand')),
    description TEXT,
    short_description TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    location TEXT,
    region TEXT,
    country TEXT DEFAULT 'Kenya',
    language TEXT,
    population_count INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    event_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_ai_populated BOOLEAN DEFAULT false,
    ai_content JSONB DEFAULT '{}',
    history TEXT,
    religion TEXT,
    artifacts JSONB DEFAULT '[]',
    traditions JSONB DEFAULT '[]',
    notable_figures JSONB DEFAULT '[]',
    cuisine JSONB DEFAULT '[]',
    music_dance JSONB DEFAULT '[]',
    attire JSONB DEFAULT '[]',
    language_phrases JSONB DEFAULT '[]',
    external_links JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active','archived','pending_review')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tribe_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member','moderator','admin','elder')),
    membership_status TEXT DEFAULT 'pending' CHECK (membership_status IN ('pending','approved','banned')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now(),
    notifications_enabled BOOLEAN DEFAULT true,
    UNIQUE(tribe_id, user_id)
);

CREATE TABLE IF NOT EXISTS tribe_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text','image','video','audio','poll','event','artifact')),
    media_urls JSONB DEFAULT '[]',
    poll_data JSONB DEFAULT '{}',
    artifact_data JSONB DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_announcement BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'published' CHECK (status IN ('published','pending','rejected','archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tribe_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES tribe_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS tribe_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES tribe_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES tribe_comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tribe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'gathering' CHECK (event_type IN ('gathering','ceremony','festival','meeting','celebration','mourning','learning')),
    location TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    is_virtual BOOLEAN DEFAULT false,
    virtual_link TEXT,
    max_attendees INTEGER,
    attendee_count INTEGER DEFAULT 0,
    cover_url TEXT,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tribe_event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES tribe_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rsvp_status TEXT DEFAULT 'going' CHECK (rsvp_status IN ('going','maybe','not_going')),
    checked_in BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS tribe_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','image','audio','system')),
    media_url TEXT,
    reply_to_id UUID REFERENCES tribe_messages(id),
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tribe_ai_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('history','religion','artifact','tradition','figure','cuisine','music','language')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    verified_by UUID REFERENCES auth.users(id),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tribes_category ON tribes(category);
CREATE INDEX idx_tribes_slug ON tribes(slug);
CREATE INDEX idx_tribes_status ON tribes(status);
CREATE INDEX idx_tribe_members_tribe ON tribe_members(tribe_id);
CREATE INDEX idx_tribe_members_user ON tribe_members(user_id);
CREATE INDEX idx_tribe_posts_tribe ON tribe_posts(tribe_id);
CREATE INDEX idx_tribe_posts_author ON tribe_posts(author_id);
CREATE INDEX idx_tribe_posts_created ON tribe_posts(created_at DESC);
CREATE INDEX idx_tribe_events_tribe ON tribe_events(tribe_id);
CREATE INDEX idx_tribe_events_start ON tribe_events(start_time);
CREATE INDEX idx_tribe_messages_tribe ON tribe_messages(tribe_id);
CREATE INDEX idx_tribe_messages_created ON tribe_messages(created_at DESC);

-- RLS
ALTER TABLE tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_ai_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tribes readable by all" ON tribes FOR SELECT USING (status = 'active');
CREATE POLICY "Tribes insertable by auth users" ON tribes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Tribes updatable by creator or admin" ON tribes FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM tribe_members WHERE tribe_id = tribes.id AND user_id = auth.uid() AND role IN ('admin','moderator'))
);

CREATE POLICY "Members readable by tribe members" ON tribe_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_members.tribe_id AND tm.user_id = auth.uid())
);
CREATE POLICY "Members insert by self" ON tribe_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members update own or admin" ON tribe_members FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_members.tribe_id AND tm.user_id = auth.uid() AND tm.role IN ('admin','moderator'))
);

CREATE POLICY "Posts readable by tribe members" ON tribe_posts FOR SELECT USING (
    status = 'published' AND
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_posts.tribe_id AND tm.user_id = auth.uid() AND tm.membership_status = 'approved')
);
CREATE POLICY "Posts insert by tribe members" ON tribe_posts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_posts.tribe_id AND tm.user_id = auth.uid() AND tm.membership_status = 'approved')
);
CREATE POLICY "Posts update by author or admin" ON tribe_posts FOR UPDATE USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_posts.tribe_id AND tm.user_id = auth.uid() AND tm.role IN ('admin','moderator'))
);

CREATE POLICY "Events readable by tribe members" ON tribe_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_events.tribe_id AND tm.user_id = auth.uid() AND tm.membership_status = 'approved')
);
CREATE POLICY "Events insert by tribe members" ON tribe_events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_events.tribe_id AND tm.user_id = auth.uid() AND tm.membership_status = 'approved')
);

CREATE POLICY "Messages readable by tribe members" ON tribe_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_messages.tribe_id AND tm.user_id = auth.uid() AND tm.membership_status = 'approved')
);
CREATE POLICY "Messages insert by tribe members" ON tribe_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_messages.tribe_id AND tm.user_id = auth.uid() AND tm.membership_status = 'approved')
);

CREATE POLICY "AI content readable by tribe members" ON tribe_ai_content FOR SELECT USING (
    EXISTS (SELECT 1 FROM tribe_members tm WHERE tm.tribe_id = tribe_ai_content.tribe_id AND tm.user_id = auth.uid() AND tm.membership_status = 'approved')
);

-- Triggers
CREATE OR REPLACE FUNCTION increment_tribe_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tribes SET member_count = member_count + 1 WHERE id = NEW.tribe_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tribes SET member_count = member_count - 1 WHERE id = OLD.tribe_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tribe_member_count
AFTER INSERT OR DELETE ON tribe_members
FOR EACH ROW EXECUTE FUNCTION increment_tribe_member_count();

CREATE OR REPLACE FUNCTION increment_tribe_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        UPDATE tribes SET post_count = post_count + 1 WHERE id = NEW.tribe_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tribes SET post_count = post_count - 1 WHERE id = OLD.tribe_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tribe_post_count
AFTER INSERT OR DELETE ON tribe_posts
FOR EACH ROW EXECUTE FUNCTION increment_tribe_post_count();
