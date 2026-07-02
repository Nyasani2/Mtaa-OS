-- ============================================================
-- MTAA OS: Fix user_profiles RLS Policies
-- Issue: 403 Forbidden on PATCH user_profiles
-- Root Cause: Missing or incorrect RLS policies on user_profiles
-- ============================================================

-- Enable RLS on user_profiles (if not already enabled)
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (safe recreation)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all operations on own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;

-- ============================================================
-- CREATE COMPREHENSIVE RLS POLICIES
-- ============================================================

-- 1. SELECT: Users can read their own profile + public profiles
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles up2
    WHERE up2.user_id = auth.uid() AND up2.role IN ('admin', 'super_admin')
  )
);

-- 2. INSERT: Users can create their own profile
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can update their own profile (THIS FIXES THE 403)
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. DELETE: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.user_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================
-- ALSO FIX: avatars bucket RLS (for image uploads)
-- ============================================================

-- Ensure the avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- Drop existing storage policies for avatars
DROP POLICY IF EXISTS "Avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete own" ON storage.objects;

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Avatar uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- Allow anyone to read avatars (public profiles)
CREATE POLICY "Avatar public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Avatar delete own"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- FIX: follows table RLS (also showing 403 in console)
-- ============================================================

ALTER TABLE IF EXISTS public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can insert follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;

CREATE POLICY "Users can view follows"
ON public.follows
FOR SELECT
USING (true);

CREATE POLICY "Users can insert follows"
ON public.follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
ON public.follows
FOR DELETE
USING (auth.uid() = follower_id);

-- ============================================================
-- FIX: user_home_settings table RLS (showing 406)
-- ============================================================

ALTER TABLE IF EXISTS public.user_home_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_home_settings;
DROP POLICY IF EXISTS "Users can upsert own settings" ON public.user_home_settings;

CREATE POLICY "Users can view own settings"
ON public.user_home_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own settings"
ON public.user_home_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO anon;
GRANT ALL ON public.user_profiles TO service_role;

GRANT ALL ON public.follows TO authenticated;
GRANT ALL ON public.follows TO anon;
GRANT ALL ON public.follows TO service_role;

GRANT ALL ON public.user_home_settings TO authenticated;
GRANT ALL ON public.user_home_settings TO anon;
GRANT ALL ON public.user_home_settings TO service_role;

-- ============================================================
-- VERIFY: Check if user_profiles row exists for current user
-- Run this manually if needed to create missing profile rows
-- ============================================================

-- If a user exists in auth.users but not in user_profiles, run:
-- INSERT INTO public.user_profiles (user_id, display_name, username, full_name)
-- SELECT id, email, split_part(email, '@', 1), split_part(email, '@', 1)
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
-- ON CONFLICT (user_id) DO NOTHING;
