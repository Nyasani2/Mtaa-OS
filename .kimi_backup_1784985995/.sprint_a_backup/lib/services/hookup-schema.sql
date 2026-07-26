-- ============================================================
-- MTAA HOOKUP MODULE — Database Schema
-- ============================================================
-- One MTAA Profile. No duplicate accounts.
-- Uses existing profiles table for identity.
-- All dating-specific data lives in hookup_* tables.

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Hookup preferences (dating profile + discovery settings)
CREATE TABLE IF NOT EXISTS hookup_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Profile fields
  bio TEXT,
  gender TEXT,
  looking_for TEXT[], -- genders they're interested in
  relationship_intent TEXT,
  interests TEXT[],
  occupation TEXT,
  education TEXT,
  city TEXT,
  country TEXT,
  languages TEXT,
  religion TEXT,
  tribe TEXT,
  height TEXT,
  children TEXT,
  wants_children TEXT,
  smoker TEXT,
  drinker TEXT,

  -- Discovery filters
  show_me TEXT[],
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 50,
  distance_max_km INTEGER DEFAULT 50,
  relationship_intents_filter TEXT[],
  verified_only BOOLEAN DEFAULT false,
  with_photos_only BOOLEAN DEFAULT false,

  -- Privacy
  show_online_status BOOLEAN DEFAULT true,
  invisible_mode BOOLEAN DEFAULT false,
  hide_from_discovery BOOLEAN DEFAULT false,
  require_message_request BOOLEAN DEFAULT false,
  show_distance BOOLEAN DEFAULT true,
  show_age BOOLEAN DEFAULT true,

  -- Verification
  verified_level INTEGER DEFAULT 0, -- 0=none, 1=phone, 2=ID, 3=face, 4=pro
  id_verified BOOLEAN DEFAULT false,
  id_number TEXT,
  face_verified BOOLEAN DEFAULT false,

  -- Notifications
  new_match_notif BOOLEAN DEFAULT true,
  new_like_notif BOOLEAN DEFAULT true,
  message_notif BOOLEAN DEFAULT true,
  event_notif BOOLEAN DEFAULT true,

  -- Premium
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id)
);

-- Additional photos for hookup profiles
CREATE TABLE IF NOT EXISTS hookup_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Likes (swipes right)
CREATE TABLE IF NOT EXISTS hookup_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_super BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);

-- Passes (swipes left)
CREATE TABLE IF NOT EXISTS hookup_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  passed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(passer_id, passed_id)
);

-- Matches (mutual likes)
CREATE TABLE IF NOT EXISTS hookup_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Blocks
CREATE TABLE IF NOT EXISTS hookup_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS hookup_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending', -- pending, investigating, resolved, dismissed
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE hookup_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE hookup_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hookup_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hookup_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hookup_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hookup_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hookup_reports ENABLE ROW LEVEL SECURITY;

-- hookup_preferences: everyone can read (for discovery), only owner can modify
CREATE POLICY "hookup_prefs_select_all" ON hookup_preferences FOR SELECT USING (true);
CREATE POLICY "hookup_prefs_insert_own" ON hookup_preferences FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "hookup_prefs_update_own" ON hookup_preferences FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "hookup_prefs_delete_own" ON hookup_preferences FOR DELETE USING (auth.uid() = profile_id);

-- hookup_photos: everyone can read, only owner can modify
CREATE POLICY "hookup_photos_select_all" ON hookup_photos FOR SELECT USING (true);
CREATE POLICY "hookup_photos_insert_own" ON hookup_photos FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "hookup_photos_delete_own" ON hookup_photos FOR DELETE USING (auth.uid() = profile_id);

-- hookup_likes: users can see their own likes, insert their own
CREATE POLICY "hookup_likes_select_own" ON hookup_likes FOR SELECT USING (auth.uid() = liker_id OR auth.uid() = liked_id);
CREATE POLICY "hookup_likes_insert_own" ON hookup_likes FOR INSERT WITH CHECK (auth.uid() = liker_id);
CREATE POLICY "hookup_likes_delete_own" ON hookup_likes FOR DELETE USING (auth.uid() = liker_id);

-- hookup_passes: users can see their own passes
CREATE POLICY "hookup_passes_select_own" ON hookup_passes FOR SELECT USING (auth.uid() = passer_id);
CREATE POLICY "hookup_passes_insert_own" ON hookup_passes FOR INSERT WITH CHECK (auth.uid() = passer_id);
CREATE POLICY "hookup_passes_delete_own" ON hookup_passes FOR DELETE USING (auth.uid() = passer_id);

-- hookup_matches: both parties can see
CREATE POLICY "hookup_matches_select_parties" ON hookup_matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "hookup_matches_insert_system" ON hookup_matches FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "hookup_matches_delete_parties" ON hookup_matches FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- hookup_blocks: blocker can manage
CREATE POLICY "hookup_blocks_select_own" ON hookup_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "hookup_blocks_insert_own" ON hookup_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "hookup_blocks_delete_own" ON hookup_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- hookup_reports: reporter can see their own, admins can see all
CREATE POLICY "hookup_reports_select_own" ON hookup_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "hookup_reports_insert_own" ON hookup_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_hookup_prefs_profile_id ON hookup_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_hookup_photos_profile_id ON hookup_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_hookup_likes_liker ON hookup_likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_hookup_likes_liked ON hookup_likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_hookup_passes_passer ON hookup_passes(passer_id);
CREATE INDEX IF NOT EXISTS idx_hookup_matches_user1 ON hookup_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_hookup_matches_user2 ON hookup_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_hookup_blocks_blocker ON hookup_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_hookup_reports_reporter ON hookup_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_hookup_reports_reported ON hookup_reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_hookup_reports_status ON hookup_reports(status);

-- ============================================================
-- TRIGGER: Update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hookup_prefs_updated_at ON hookup_preferences;
CREATE TRIGGER hookup_prefs_updated_at
  BEFORE UPDATE ON hookup_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS hookup_reports_updated_at ON hookup_reports;
CREATE TRIGGER hookup_reports_updated_at
  BEFORE UPDATE ON hookup_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
