-- Streets Module Edge Functions / RPC
-- Run this in your Supabase SQL Editor

-- ─── Increment/Decrement Like Count ────────────────────────
CREATE OR REPLACE FUNCTION increment_like_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_like_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Increment/Decrement Comment Count ─────────────────────
CREATE OR REPLACE FUNCTION increment_comment_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts
  SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comment_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts
  SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Increment/Decrement Share Count ─────────────────────
CREATE OR REPLACE FUNCTION increment_share_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts
  SET shares_count = COALESCE(shares_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Increment/Decrement Save Count ────────────────────────
CREATE OR REPLACE FUNCTION increment_save_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts
  SET saves_count = COALESCE(saves_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_save_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts
  SET saves_count = GREATEST(COALESCE(saves_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Increment View Count ──────────────────────────────────
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Update Creator Stats (trigger) ────────────────────────
CREATE OR REPLACE FUNCTION update_creator_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert creator stats
  INSERT INTO streets_creator_stats (
    creator_id,
    total_posts,
    total_likes,
    total_views,
    total_followers,
    updated_at
  )
  SELECT
    NEW.creator_id,
    COUNT(*),
    COALESCE(SUM(likes_count), 0),
    COALESCE(SUM(views_count), 0),
    0,
    NOW()
  FROM streets_posts
  WHERE creator_id = NEW.creator_id
  ON CONFLICT (creator_id)
  DO UPDATE SET
    total_posts = EXCLUDED.total_posts,
    total_likes = EXCLUDED.total_likes,
    total_views = EXCLUDED.total_views,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_creator_stats_trigger ON streets_posts;

-- Create trigger
CREATE TRIGGER update_creator_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON streets_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_stats();

-- ─── Update Follower Count ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update follower count for the followed user
    UPDATE streets_creator_stats
    SET total_followers = COALESCE(total_followers, 0) + 1,
        updated_at = NOW()
    WHERE creator_id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE streets_creator_stats
    SET total_followers = GREATEST(COALESCE(total_followers, 0) - 1, 0),
        updated_at = NOW()
    WHERE creator_id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_follower_count_trigger ON streets_follows;

CREATE TRIGGER update_follower_count_trigger
AFTER INSERT OR DELETE ON streets_follows
FOR EACH ROW
EXECUTE FUNCTION update_follower_count();

-- ─── Create Notification on Like ───────────────────────────
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_creator UUID;
BEGIN
  SELECT creator_id INTO post_creator
  FROM streets_posts
  WHERE id = NEW.post_id;

  -- Don't notify self-likes
  IF post_creator = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO streets_notifications (
    user_id,
    type,
    actor_id,
    post_id,
    is_read,
    created_at
  ) VALUES (
    post_creator,
    'like',
    NEW.user_id,
    NEW.post_id,
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_like_notification_trigger ON streets_likes;

CREATE TRIGGER create_like_notification_trigger
AFTER INSERT ON streets_likes
FOR EACH ROW
EXECUTE FUNCTION create_like_notification();

-- ─── Create Notification on Comment ────────────────────────
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_creator UUID;
BEGIN
  SELECT creator_id INTO post_creator
  FROM streets_posts
  WHERE id = NEW.post_id;

  IF post_creator = NEW.creator_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO streets_notifications (
    user_id,
    type,
    actor_id,
    post_id,
    comment_id,
    is_read,
    created_at
  ) VALUES (
    post_creator,
    'comment',
    NEW.creator_id,
    NEW.post_id,
    NEW.id,
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_comment_notification_trigger ON streets_comments;

CREATE TRIGGER create_comment_notification_trigger
AFTER INSERT ON streets_comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_notification();

-- ─── Create Notification on Follow ─────────────────────────
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO streets_notifications (
    user_id,
    type,
    actor_id,
    is_read,
    created_at
  ) VALUES (
    NEW.following_id,
    'follow',
    NEW.follower_id,
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_follow_notification_trigger ON streets_follows;

CREATE TRIGGER create_follow_notification_trigger
AFTER INSERT ON streets_follows
FOR EACH ROW
EXECUTE FUNCTION create_follow_notification();
