-- Streets Bug Fixes SQL
-- Run this in Supabase SQL Editor

-- 1. Create decrement_post_likes RPC (for unlike functionality)
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.streets_posts 
  SET likes_count = GREATEST(0, likes_count - 1) 
  WHERE id = post_id;
END;
$$;

-- 2. Verify increment_post_likes exists and is correct
-- (Already exists per your query, but let's ensure it's robust)
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.streets_posts 
  SET likes_count = likes_count + 1 
  WHERE id = post_id;
END;
$$;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_post_likes(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_likes(UUID) TO anon, authenticated;

-- 4. Clean up duplicate RLS policies on streets_likes
-- (Keep only the essential ones)
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop duplicate SELECT policies, keep streets_likes_select
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'streets_likes' 
    AND policyname LIKE '%view%' 
    AND policyname != 'streets_likes_select'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON streets_likes', pol.policyname);
  END LOOP;

  -- Drop duplicate INSERT policies, keep streets_likes_insert
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'streets_likes' 
    AND policyname LIKE '%like%' 
    AND policyname NOT IN ('streets_likes_insert', 'streets_likes_insert_own')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON streets_likes', pol.policyname);
  END LOOP;
END $$;

-- 5. Add missing content column trigger (if posts are created with null content)
-- This ensures text posts store their content properly
CREATE OR REPLACE FUNCTION streets_ensure_content()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If content is null but media exists, keep it as-is (media-only post)
  -- If content is null and no media, set empty string
  IF NEW.content IS NULL AND NEW.media_url IS NULL THEN
    NEW.content := '';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS streets_ensure_content_trigger ON streets_posts;
CREATE TRIGGER streets_ensure_content_trigger
  BEFORE INSERT ON streets_posts
  FOR EACH ROW
  EXECUTE FUNCTION streets_ensure_content();
