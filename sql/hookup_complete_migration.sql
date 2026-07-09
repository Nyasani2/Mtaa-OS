-- ============================================
-- HOOKUP MODULE COMPLETE MIGRATION
-- Run in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. hookup_preferences (profile settings & matching preferences)
CREATE TABLE IF NOT EXISTS public.hookup_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  gender TEXT,
  looking_for TEXT[] DEFAULT '{}',
  relationship_intent TEXT,
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 50,
  distance_max_km INTEGER DEFAULT 50,
  interests TEXT[] DEFAULT '{}',
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
  verified_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id)
);

-- 2. hookup_photos (user photo gallery)
CREATE TABLE IF NOT EXISTS public.hookup_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. hookup_likes (swipe tracking)
CREATE TABLE IF NOT EXISTS public.hookup_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'pass', 'super_like')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);

-- 4. hookup_matches (mutual likes)
CREATE TABLE IF NOT EXISTS public.hookup_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- 5. hookup_reports (user reporting)
CREATE TABLE IF NOT EXISTS public.hookup_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 6. hookup_blocks (user blocking)
CREATE TABLE IF NOT EXISTS public.hookup_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- 7. Storage bucket for hookup photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hookup-photos', 'hookup-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

-- hookup_preferences RLS
ALTER TABLE public.hookup_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hookup preferences"
  ON public.hookup_preferences FOR SELECT USING (true);

CREATE POLICY "Users can manage own hookup preferences"
  ON public.hookup_preferences FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- hookup_photos RLS
ALTER TABLE public.hookup_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hookup photos"
  ON public.hookup_photos FOR SELECT USING (true);

CREATE POLICY "Users can manage own hookup photos"
  ON public.hookup_photos FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- hookup_likes RLS
ALTER TABLE public.hookup_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own likes"
  ON public.hookup_likes FOR SELECT
  USING (liker_id = auth.uid() OR liked_id = auth.uid());

CREATE POLICY "Users can create own likes"
  ON public.hookup_likes FOR INSERT WITH CHECK (liker_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON public.hookup_likes FOR DELETE USING (liker_id = auth.uid());

-- hookup_matches RLS
ALTER TABLE public.hookup_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON public.hookup_matches FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- hookup_reports RLS
ALTER TABLE public.hookup_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.hookup_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports"
  ON public.hookup_reports FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- hookup_blocks RLS
ALTER TABLE public.hookup_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks"
  ON public.hookup_blocks FOR SELECT USING (blocker_id = auth.uid());

CREATE POLICY "Users can create own blocks"
  ON public.hookup_blocks FOR INSERT WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can delete own blocks"
  ON public.hookup_blocks FOR DELETE USING (blocker_id = auth.uid());

-- Storage RLS
CREATE POLICY "Anyone can view hookup photos"
  ON storage.objects FOR SELECT USING (bucket_id = 'hookup-photos');

CREATE POLICY "Authenticated users can upload hookup photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'hookup-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own hookup photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'hookup-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hookup_prefs_profile_id ON public.hookup_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_hookup_photos_profile_id ON public.hookup_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_hookup_photos_primary ON public.hookup_photos(profile_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_hookup_likes_liker_id ON public.hookup_likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_hookup_likes_liked_id ON public.hookup_likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_hookup_matches_user1 ON public.hookup_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_hookup_matches_user2 ON public.hookup_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_hookup_reports_reporter ON public.hookup_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_hookup_reports_reported ON public.hookup_reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_hookup_blocks_blocker ON public.hookup_blocks(blocker_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hookup_preferences_updated_at
  BEFORE UPDATE ON public.hookup_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hookup_photos_updated_at
  BEFORE UPDATE ON public.hookup_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
