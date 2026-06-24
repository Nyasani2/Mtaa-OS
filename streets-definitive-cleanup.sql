-- ============================================
-- MTAA STREETS DEFINITIVE CLEANUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Show current state BEFORE cleanup
SELECT 'BEFORE CLEANUP' as status;
SELECT 
  media_type,
  COUNT(*) as count,
  COUNT(media_url) as with_media_url
FROM public.streets_posts
GROUP BY media_type
ORDER BY count DESC;

-- Step 2: Mark ALL posts with media_url pointing to non-existent files as text-only
-- This covers: content/ bucket, null media_type, and any other bad URLs
UPDATE public.streets_posts
SET 
  media_type = 'text',
  media_url = NULL
WHERE 
  -- Old Firebase content bucket (files don't exist in Supabase)
  media_url LIKE '%/content/%'
  -- OR null media_type with media_url (corrupted records)
  OR (media_type IS NULL AND media_url IS NOT NULL)
  -- OR any media_url that doesn't point to our valid media bucket
  OR (media_url IS NOT NULL AND media_url NOT LIKE '%/media/%');

-- Step 3: Fix remaining media_type mismatches
UPDATE public.streets_posts
SET media_type = 'image'
WHERE media_type = 'video' 
  AND (media_url ILIKE '%.jpg' OR media_url ILIKE '%.jpeg' OR media_url ILIKE '%.png' OR media_url ILIKE '%.webp' OR media_url ILIKE '%.gif');

UPDATE public.streets_posts
SET media_type = 'video'
WHERE media_type = 'image' 
  AND (media_url ILIKE '%.mp4' OR media_url ILIKE '%.mov' OR media_url ILIKE '%.webm');

-- Step 4: Fix null media_type with no media_url
UPDATE public.streets_posts
SET media_type = 'text'
WHERE media_type IS NULL AND media_url IS NULL;

-- Step 5: Show state AFTER cleanup
SELECT 'AFTER CLEANUP' as status;
SELECT 
  media_type,
  COUNT(*) as count,
  COUNT(media_url) as with_media_url
FROM public.streets_posts
GROUP BY media_type
ORDER BY count DESC;

-- Step 6: Show remaining posts with actual media
SELECT 
  id,
  media_type,
  LEFT(media_url, 100) as url_preview
FROM public.streets_posts
WHERE media_url IS NOT NULL
ORDER BY media_type, created_at DESC;
