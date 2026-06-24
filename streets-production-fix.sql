-- ============================================
-- MTAA STREETS PRODUCTION FIXES
-- Run this in Supabase SQL Editor
-- ============================================

-- FIX 1: Repair broken RPC functions (parameter name mismatch)
-- The functions had 'postId' instead of 'post_id' causing 400 errors
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.streets_posts 
  SET likes_count = COALESCE(likes_count, 0) + 1 
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_post_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.streets_posts 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$;

-- FIX 2: Repair saves RPC functions (same bug pattern)
CREATE OR REPLACE FUNCTION public.increment_saves(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.streets_posts 
  SET saves_count = COALESCE(saves_count, 0) + 1 
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_saves(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.streets_posts 
  SET saves_count = GREATEST(COALESCE(saves_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$;

-- FIX 3: Repair shares RPC function
CREATE OR REPLACE FUNCTION public.increment_shares(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.streets_posts 
  SET shares_count = COALESCE(shares_count, 0) + 1 
  WHERE id = post_id;
END;
$$;

-- FIX 4: Remove duplicate unique constraint on streets_likes
-- Having both streets_likes_post_id_user_id_key AND streets_likes_user_id_post_id_key
-- causes unnecessary 409 conflicts
ALTER TABLE public.streets_likes 
DROP CONSTRAINT IF EXISTS streets_likes_user_id_post_id_key;

-- FIX 5: Fix corrupted media_type records
-- Video posts pointing to JPG files break the video player
UPDATE public.streets_posts
SET media_type = 'image'
WHERE media_type = 'video' 
  AND (media_url ILIKE '%.jpg' OR media_url ILIKE '%.jpeg' OR media_url ILIKE '%.png' OR media_url ILIKE '%.webp');

UPDATE public.streets_posts
SET media_type = 'video'
WHERE media_type = 'image' 
  AND (media_url ILIKE '%.mp4' OR media_url ILIKE '%.mov' OR media_url ILIKE '%.webm');

-- FIX 6: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_post_likes(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_post_likes(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_saves(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_saves(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_shares(UUID) TO anon, authenticated;

-- FIX 7: Verify all RPC functions are correct
SELECT proname, pg_get_function_arguments(oid) as args
FROM pg_proc
WHERE proname IN ('increment_post_likes', 'decrement_post_likes', 'increment_saves', 'decrement_saves', 'increment_shares')
ORDER BY proname;
