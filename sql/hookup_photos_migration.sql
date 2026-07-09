-- Hookup Photos Migration
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create hookup_photos table
CREATE TABLE IF NOT EXISTS public.hookup_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create hookup_interests table
CREATE TABLE IF NOT EXISTS public.hookup_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, interest)
);

-- 3. Create hookup_preferences table
CREATE TABLE IF NOT EXISTS public.hookup_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  looking_for TEXT DEFAULT 'everyone',
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 50,
  distance_max INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. Create hookup_likes table (if not exists)
CREATE TABLE IF NOT EXISTS public.hookup_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'pass')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_id)
);

-- 5. Create hookup_matches table (if not exists)
CREATE TABLE IF NOT EXISTS public.hookup_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- 6. Create storage bucket for hookup photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hookup-photos', 'hookup-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 7. RLS Policies for hookup_photos
ALTER TABLE public.hookup_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos of profiles they can see"
  ON public.hookup_photos
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own photos"
  ON public.hookup_photos
  FOR ALL
  USING (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- 8. RLS Policies for hookup_interests
ALTER TABLE public.hookup_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interests"
  ON public.hookup_interests
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own interests"
  ON public.hookup_interests
  FOR ALL
  USING (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- 9. RLS Policies for hookup_preferences
ALTER TABLE public.hookup_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view preferences"
  ON public.hookup_preferences
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own preferences"
  ON public.hookup_preferences
  FOR ALL
  USING (user_id = auth.uid());

-- 10. RLS Policies for hookup_likes
ALTER TABLE public.hookup_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own likes"
  ON public.hookup_likes
  FOR SELECT
  USING (user_id = auth.uid() OR target_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own likes"
  ON public.hookup_likes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own likes"
  ON public.hookup_likes
  FOR DELETE
  USING (user_id = auth.uid());

-- 11. RLS Policies for hookup_matches
ALTER TABLE public.hookup_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
  ON public.hookup_matches
  FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- 12. Storage RLS Policies
CREATE POLICY "Anyone can view hookup photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'hookup-photos');

CREATE POLICY "Authenticated users can upload hookup photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'hookup-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own hookup photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'hookup-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 13. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hookup_photos_profile_id ON public.hookup_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_hookup_photos_primary ON public.hookup_photos(profile_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_hookup_interests_profile_id ON public.hookup_interests(profile_id);
CREATE INDEX IF NOT EXISTS idx_hookup_likes_user_id ON public.hookup_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_hookup_likes_target_id ON public.hookup_likes(target_id);
CREATE INDEX IF NOT EXISTS idx_hookup_matches_user1 ON public.hookup_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_hookup_matches_user2 ON public.hookup_matches(user2_id);

-- 14. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hookup_photos_updated_at
  BEFORE UPDATE ON public.hookup_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hookup_preferences_updated_at
  BEFORE UPDATE ON public.hookup_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
