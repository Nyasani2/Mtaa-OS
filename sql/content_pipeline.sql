-- MTAA Content Pipeline Schema
-- Run this in Supabase SQL Editor

-- Media posts table (videos, photos)
CREATE TABLE IF NOT EXISTS public.media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'photo')),
  title TEXT,
  description TEXT,
  uri TEXT NOT NULL,           -- Storage URL
  thumbnail TEXT,              -- Thumbnail URL
  duration INTEGER,            -- Seconds (for videos)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'processing', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Media analytics (views, likes, comments, shares)
CREATE TABLE IF NOT EXISTS public.media_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.media_posts(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Media likes (who liked what)
CREATE TABLE IF NOT EXISTS public.media_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.media_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(media_id, user_id)
);

-- Media comments
CREATE TABLE IF NOT EXISTS public.media_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.media_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.media_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view active media
CREATE POLICY "media_posts_public_view"
  ON public.media_posts FOR SELECT
  USING (status = 'active');

-- Users can manage their own media
CREATE POLICY "media_posts_user_manage"
  ON public.media_posts FOR ALL
  USING (auth.uid() = user_id);

-- Analytics public read
CREATE POLICY "media_analytics_public_view"
  ON public.media_analytics FOR SELECT
  TO authenticated, anon
  USING (true);

-- Likes: anyone can like, users can unlike their own
CREATE POLICY "media_likes_insert"
  ON public.media_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "media_likes_delete"
  ON public.media_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments: public read, authenticated insert
CREATE POLICY "media_comments_public_view"
  ON public.media_comments FOR SELECT
  USING (true);

CREATE POLICY "media_comments_insert"
  ON public.media_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_posts_user ON public.media_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_media_posts_type ON public.media_posts(type);
CREATE INDEX IF NOT EXISTS idx_media_posts_created ON public.media_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_analytics_media ON public.media_analytics(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_media ON public.media_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_comments_media ON public.media_comments(media_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_media_views(media_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.media_analytics (media_id, views)
  VALUES (media_id, 1)
  ON CONFLICT (media_id)
  DO UPDATE SET views = public.media_analytics.views + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle like
CREATE OR REPLACE FUNCTION public.toggle_media_like(p_media_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_likes INTEGER;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.media_likes WHERE media_id = p_media_id AND user_id = p_user_id)
  INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.media_likes WHERE media_id = p_media_id AND user_id = p_user_id;
  ELSE
    INSERT INTO public.media_likes (media_id, user_id) VALUES (p_media_id, p_user_id);
  END IF;

  SELECT COUNT(*) INTO v_likes FROM public.media_likes WHERE media_id = p_media_id;

  UPDATE public.media_analytics SET likes = v_likes, updated_at = now()
  WHERE media_id = p_media_id;

  RETURN jsonb_build_object('liked', NOT v_exists, 'likes', v_likes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
