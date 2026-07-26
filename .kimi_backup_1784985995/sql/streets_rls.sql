-- ============================================================
-- STREETS MODULE — RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable RLS on all streets tables
ALTER TABLE public.streets_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streets_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streets_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "streets_posts_select_public" ON public.streets_posts;
DROP POLICY IF EXISTS "streets_posts_insert_own" ON public.streets_posts;
DROP POLICY IF EXISTS "streets_posts_update_own" ON public.streets_posts;
DROP POLICY IF EXISTS "streets_posts_delete_own" ON public.streets_posts;
DROP POLICY IF EXISTS "streets_likes_insert_own" ON public.streets_likes;
DROP POLICY IF EXISTS "streets_likes_delete_own" ON public.streets_likes;
DROP POLICY IF EXISTS "streets_likes_select_public" ON public.streets_likes;
DROP POLICY IF EXISTS "streets_comments_select_public" ON public.streets_comments;
DROP POLICY IF EXISTS "streets_comments_insert_own" ON public.streets_comments;
DROP POLICY IF EXISTS "streets_comments_delete_own" ON public.streets_comments;

-- ─── streets_posts ──────────────────────────────────────────

-- Anyone can read public posts
CREATE POLICY "streets_posts_select_public"
  ON public.streets_posts
  FOR SELECT
  USING (is_public = true);

-- Users can read their own posts (even if not public)
CREATE POLICY "streets_posts_select_own"
  ON public.streets_posts
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Authenticated users can create posts
CREATE POLICY "streets_posts_insert_own"
  ON public.streets_posts
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Users can update their own posts
CREATE POLICY "streets_posts_update_own"
  ON public.streets_posts
  FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Users can delete their own posts
CREATE POLICY "streets_posts_delete_own"
  ON public.streets_posts
  FOR DELETE
  USING (auth.uid() = creator_id);

-- ─── streets_likes ──────────────────────────────────────────

-- Anyone can see likes (needed for counts)
CREATE POLICY "streets_likes_select_public"
  ON public.streets_likes
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only like as themselves
CREATE POLICY "streets_likes_insert_own"
  ON public.streets_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only unlike their own likes
CREATE POLICY "streets_likes_delete_own"
  ON public.streets_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ─── streets_comments ───────────────────────────────────────

-- Anyone can read comments on public posts
CREATE POLICY "streets_comments_select_public"
  ON public.streets_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.streets_posts
      WHERE streets_posts.id = streets_comments.post_id
      AND streets_posts.is_public = true
    )
  );

-- Users can comment as themselves
CREATE POLICY "streets_comments_insert_own"
  ON public.streets_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "streets_comments_delete_own"
  ON public.streets_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Post owners can delete comments on their posts
CREATE POLICY "streets_comments_delete_post_owner"
  ON public.streets_comments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.streets_posts
      WHERE streets_posts.id = streets_comments.post_id
      AND streets_posts.creator_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKET RLS (streets-media)
-- ============================================================

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('streets-media', 'streets-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "streets_media_select_public" ON storage.objects;
DROP POLICY IF EXISTS "streets_media_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "streets_media_delete_own" ON storage.objects;

-- Anyone can view media
CREATE POLICY "streets_media_select_public"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'streets-media');

-- Authenticated users can upload to their own folder
CREATE POLICY "streets_media_insert_own"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'streets-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own media
CREATE POLICY "streets_media_delete_own"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'streets-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
