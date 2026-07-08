-- MStudio Viewer Tables + RLS
-- Run this in Supabase SQL Editor

-- Likes table
CREATE TABLE IF NOT EXISTS studio_video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES studio_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

ALTER TABLE studio_video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON studio_video_likes FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes"
  ON studio_video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON studio_video_likes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_studio_video_likes_video ON studio_video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_studio_video_likes_user ON studio_video_likes(user_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS studio_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscriber_id, creator_id)
);

ALTER TABLE studio_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all subscriptions"
  ON studio_subscriptions FOR SELECT USING (true);

CREATE POLICY "Users can subscribe"
  ON studio_subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can unsubscribe"
  ON studio_subscriptions FOR DELETE USING (auth.uid() = subscriber_id);

CREATE INDEX IF NOT EXISTS idx_studio_subscriptions_creator ON studio_subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_studio_subscriptions_subscriber ON studio_subscriptions(subscriber_id);
