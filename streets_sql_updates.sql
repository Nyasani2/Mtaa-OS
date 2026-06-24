-- Streets TikTok v2 SQL Updates
-- Run in Supabase SQL Editor

-- 1. streets_likes table
CREATE TABLE IF NOT EXISTS public.streets_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.streets_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.streets_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View likes" ON public.streets_likes FOR SELECT USING (true);
CREATE POLICY "Like posts" ON public.streets_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unlike" ON public.streets_likes FOR DELETE USING (auth.uid() = user_id);

-- 2. RPC functions
CREATE OR REPLACE FUNCTION public.increment_street_likes(post_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.streets_posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_street_likes(post_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.streets_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = post_id;
END;
$$;

-- 3. user_follows table for Following tab
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Follow users" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Unfollow" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);
