-- ============================================================
-- STREETS MODULE — INDEXES & PERFORMANCE
-- Run this in Supabase SQL Editor
-- ============================================================

-- Core feed index: public posts ordered by created_at
CREATE INDEX IF NOT EXISTS idx_streets_posts_feed
  ON public.streets_posts (is_public, created_at DESC);

-- Creator index for profile lookups
CREATE INDEX IF NOT EXISTS idx_streets_posts_creator
  ON public.streets_posts (creator_id, created_at DESC);

-- Post lookup for detail views
CREATE INDEX IF NOT EXISTS idx_streets_posts_id
  ON public.streets_posts (id);

-- Likes: fast check if user liked post
CREATE INDEX IF NOT EXISTS idx_streets_likes_user_post
  ON public.streets_likes (user_id, post_id);

-- Likes: count per post
CREATE INDEX IF NOT EXISTS idx_streets_likes_post
  ON public.streets_likes (post_id);

-- Comments: fetch by post
CREATE INDEX IF NOT EXISTS idx_streets_comments_post
  ON public.streets_comments (post_id, created_at ASC);

-- Comments: user activity
CREATE INDEX IF NOT EXISTS idx_streets_comments_user
  ON public.streets_comments (user_id, created_at DESC);

-- Hashtag search (GIN for array containment)
CREATE INDEX IF NOT EXISTS idx_streets_posts_hashtags
  ON public.streets_posts USING GIN (hashtags);

-- Location-based queries
CREATE INDEX IF NOT EXISTS idx_streets_posts_location
  ON public.streets_posts (location) WHERE location IS NOT NULL;

-- Sponsored posts
CREATE INDEX IF NOT EXISTS idx_streets_posts_sponsored
  ON public.streets_posts (is_sponsored, created_at DESC) WHERE is_sponsored = true;

-- ============================================================
-- RPC FUNCTION: Increment view count (avoids race conditions)
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_streets_view(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.streets_posts
  SET views_count = COALESCE(views_count, 0) + 1,
      view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_streets_view(uuid) TO authenticated;

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_streets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to streets_posts
DROP TRIGGER IF EXISTS streets_posts_updated_at ON public.streets_posts;
CREATE TRIGGER streets_posts_updated_at
  BEFORE UPDATE ON public.streets_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streets_updated_at();

-- Apply to streets_comments
DROP TRIGGER IF EXISTS streets_comments_updated_at ON public.streets_comments;
CREATE TRIGGER streets_comments_updated_at
  BEFORE UPDATE ON public.streets_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streets_updated_at();
