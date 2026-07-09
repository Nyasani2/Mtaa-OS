-- MStudio Creator OS Schema Additions
-- Run this in Supabase SQL Editor after mstudio_final_tables.sql

-- ============================================
-- MUSIC TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS mstudio_music_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'ep', 'album', 'instrumental')),
  cover_art_url TEXT,
  genre TEXT,
  release_date DATE,
  description TEXT,
  composer TEXT,
  producer TEXT,
  lyrics TEXT,
  explicit BOOLEAN DEFAULT false,
  track_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mstudio_music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES mstudio_music_releases(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT,
  storage_path TEXT,
  track_number INTEGER,
  duration_seconds INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PODCAST TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS mstudio_podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_art_url TEXT,
  category TEXT,
  language TEXT DEFAULT 'English',
  explicit BOOLEAN DEFAULT false,
  episode_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mstudio_podcast_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID NOT NULL REFERENCES mstudio_podcasts(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  storage_path TEXT,
  episode_number INTEGER,
  duration_seconds INTEGER DEFAULT 0,
  guests TEXT[] DEFAULT '{}',
  transcript TEXT,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EDUCATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS mstudio_education_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lesson', 'course', 'quiz', 'exam', 'assignment', 'pdf', 'slides', 'worksheet')),
  description TEXT,
  subject TEXT,
  grade_level TEXT,
  language TEXT DEFAULT 'English',
  duration_minutes INTEGER DEFAULT 0,
  file_urls TEXT[] DEFAULT '{}',
  questions JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT true,
  price_kes NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LIVE STREAM TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS mstudio_live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'subscribers', 'members_only')),
  stream_key TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  is_live BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  current_viewers INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  enable_chat BOOLEAN DEFAULT true,
  enable_super_chat BOOLEAN DEFAULT true,
  enable_recording BOOLEAN DEFAULT true,
  monetization_enabled BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ENGAGEMENT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS mstudio_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES mstudio_videos(id) ON DELETE CASCADE,
  live_stream_id UUID REFERENCES mstudio_live_streams(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  watch_time_seconds INTEGER DEFAULT 0,
  country TEXT,
  device_type TEXT,
  traffic_source TEXT,
  viewer_age_group TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mstudio_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES mstudio_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_id)
);

CREATE TABLE IF NOT EXISTS mstudio_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES mstudio_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  parent_id UUID REFERENCES mstudio_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mstudio_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, subscriber_id)
);

-- ============================================
-- REVENUE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS mstudio_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  revenue_type TEXT NOT NULL CHECK (revenue_type IN ('ad', 'marketplace', 'tip', 'super_chat', 'membership')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mstudio_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- CAMERA SUBSCRIPTION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS mstudio_camera_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 4)),
  amount_kes NUMERIC(10,2) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- ============================================
-- KIDS MODE SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS mstudio_kids_settings (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  pin TEXT,
  enabled BOOLEAN DEFAULT false,
  block_comments BOOLEAN DEFAULT true,
  block_dms BOOLEAN DEFAULT true,
  block_live_chat BOOLEAN DEFAULT true,
  block_mature_content BOOLEAN DEFAULT true,
  require_teacher_approval BOOLEAN DEFAULT false,
  require_parent_approval BOOLEAN DEFAULT true,
  max_watch_time_minutes INTEGER DEFAULT 60,
  allowed_categories TEXT[] DEFAULT '{"Education", "Music", "Sports", "Science", "Nature"}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE mstudio_music_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_education_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_camera_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mstudio_kids_settings ENABLE ROW LEVEL SECURITY;

-- Music releases: public can view published, creator can manage own
CREATE POLICY "Public can view published music" ON mstudio_music_releases FOR SELECT USING (status = 'published');
CREATE POLICY "Creator can manage own music" ON mstudio_music_releases FOR ALL USING (creator_id = auth.uid());

-- Podcasts: public can view published, creator can manage own
CREATE POLICY "Public can view published podcasts" ON mstudio_podcasts FOR SELECT USING (status = 'published');
CREATE POLICY "Creator can manage own podcasts" ON mstudio_podcasts FOR ALL USING (creator_id = auth.uid());

-- Education: public can view published, creator can manage own
CREATE POLICY "Public can view published education" ON mstudio_education_content FOR SELECT USING (status = 'published');
CREATE POLICY "Creator can manage own education" ON mstudio_education_content FOR ALL USING (creator_id = auth.uid());

-- Live streams: public can view live/ended, creator can manage own
CREATE POLICY "Public can view live streams" ON mstudio_live_streams FOR SELECT USING (status IN ('live', 'ended'));
CREATE POLICY "Creator can manage own streams" ON mstudio_live_streams FOR ALL USING (creator_id = auth.uid());

-- Views: users can create, creators can view own
CREATE POLICY "Users can create views" ON mstudio_views FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Creators can view own analytics" ON mstudio_views FOR SELECT USING (creator_id = auth.uid());

-- Likes: users can like/unlike
CREATE POLICY "Users can manage own likes" ON mstudio_likes FOR ALL USING (user_id = auth.uid());

-- Comments: public can view, users can create own
CREATE POLICY "Public can view comments" ON mstudio_comments FOR SELECT USING (true);
CREATE POLICY "Users can create own comments" ON mstudio_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON mstudio_comments FOR DELETE USING (user_id = auth.uid());

-- Subscriptions: users can manage own
CREATE POLICY "Users can manage own subscriptions" ON mstudio_subscriptions FOR ALL USING (subscriber_id = auth.uid());

-- Revenue: creators can view own
CREATE POLICY "Creators can view own revenue" ON mstudio_revenue FOR SELECT USING (creator_id = auth.uid());

-- Payouts: creators can view own
CREATE POLICY "Creators can view own payouts" ON mstudio_payouts FOR SELECT USING (creator_id = auth.uid());

-- Camera subscriptions: users can view own
CREATE POLICY "Users can view own camera subs" ON mstudio_camera_subscriptions FOR SELECT USING (creator_id = auth.uid());

-- Kids settings: users can manage own
CREATE POLICY "Users can manage own kids settings" ON mstudio_kids_settings FOR ALL USING (profile_id = auth.uid());

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_music_releases_creator ON mstudio_music_releases(creator_id);
CREATE INDEX IF NOT EXISTS idx_music_releases_genre ON mstudio_music_releases(genre);
CREATE INDEX IF NOT EXISTS idx_music_tracks_release ON mstudio_music_tracks(release_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_creator ON mstudio_podcasts(creator_id);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_podcast ON mstudio_podcast_episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_education_creator ON mstudio_education_content(creator_id);
CREATE INDEX IF NOT EXISTS idx_education_subject ON mstudio_education_content(subject);
CREATE INDEX IF NOT EXISTS idx_live_streams_creator ON mstudio_live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON mstudio_live_streams(status);
CREATE INDEX IF NOT EXISTS idx_views_video ON mstudio_views(video_id);
CREATE INDEX IF NOT EXISTS idx_views_creator ON mstudio_views(creator_id);
CREATE INDEX IF NOT EXISTS idx_likes_video ON mstudio_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_video ON mstudio_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON mstudio_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_revenue_creator ON mstudio_revenue(creator_id);
CREATE INDEX IF NOT EXISTS idx_revenue_type ON mstudio_revenue(revenue_type);
