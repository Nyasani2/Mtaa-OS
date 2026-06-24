-- Streets Core Tables
CREATE TABLE IF NOT EXISTS streets_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('video', 'image', 'text')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  sound_id UUID,
  collaborators UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streets_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES streets_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS streets_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES streets_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streets_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES streets_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS streets_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'tip', 'live', 'collab', 'share')),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES streets_posts(id) ON DELETE CASCADE,
  content TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streets_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES streets_posts(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streets_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES streets_posts(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streets_collabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES streets_posts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, recipient_id, post_id)
);

CREATE TABLE IF NOT EXISTS streets_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('video', 'image', 'text')),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streets_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'sold_out')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streets_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES streets_products(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Studio Tables
CREATE TABLE IF NOT EXISTS studio_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_url TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_url TEXT,
  is_live BOOLEAN DEFAULT false,
  privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'followers', 'private')),
  viewer_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS studio_live_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES studio_live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_live_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES studio_live_streams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Social Tables
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- RPC Functions
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streets_posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_live_viewers(stream_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE studio_live_streams SET viewer_count = viewer_count + 1 WHERE id = stream_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_live_viewers(stream_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE studio_live_streams SET viewer_count = GREATEST(viewer_count - 1, 0) WHERE id = stream_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE streets_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_collabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_live_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_live_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Streets Posts: public posts visible to all, own posts editable
CREATE POLICY "streets_posts_select" ON streets_posts FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "streets_posts_insert" ON streets_posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "streets_posts_update" ON streets_posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "streets_posts_delete" ON streets_posts FOR DELETE USING (user_id = auth.uid());

-- Likes: users can like/unlike
CREATE POLICY "streets_likes_all" ON streets_likes FOR ALL USING (user_id = auth.uid());

-- Comments: visible to all, insert own
CREATE POLICY "streets_comments_select" ON streets_comments FOR SELECT USING (true);
CREATE POLICY "streets_comments_insert" ON streets_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "streets_comments_delete" ON streets_comments FOR DELETE USING (user_id = auth.uid());

-- Saves: own only
CREATE POLICY "streets_saves_all" ON streets_saves FOR ALL USING (user_id = auth.uid());

-- Notifications: recipient only
CREATE POLICY "streets_notifications_select" ON streets_notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "streets_notifications_update" ON streets_notifications FOR UPDATE USING (recipient_id = auth.uid());

-- Reports: reporter only
CREATE POLICY "streets_reports_all" ON streets_reports FOR ALL USING (reporter_id = auth.uid());

-- Tips: sender or recipient
CREATE POLICY "streets_tips_select" ON streets_tips FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Collabs: involved parties
CREATE POLICY "streets_collabs_select" ON streets_collabs FOR SELECT USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- Drafts: own only
CREATE POLICY "streets_drafts_all" ON streets_drafts FOR ALL USING (user_id = auth.uid());

-- Products: seller or public
CREATE POLICY "streets_products_select" ON streets_products FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "streets_products_all" ON streets_products FOR ALL USING (seller_id = auth.uid());

-- Orders: buyer or seller
CREATE POLICY "streets_orders_select" ON streets_orders FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Studio Sounds: public read
CREATE POLICY "studio_sounds_select" ON studio_sounds FOR SELECT USING (true);

-- Live Streams: public or invited
CREATE POLICY "studio_live_streams_select" ON studio_live_streams FOR SELECT USING (privacy = 'public' OR creator_id = auth.uid());
CREATE POLICY "studio_live_streams_all" ON studio_live_streams FOR ALL USING (creator_id = auth.uid());

-- Live Comments: visible to stream viewers
CREATE POLICY "studio_live_comments_select" ON studio_live_comments FOR SELECT USING (true);
CREATE POLICY "studio_live_comments_insert" ON studio_live_comments FOR INSERT WITH CHECK (user_id = auth.uid());

-- Live Gifts: sender or recipient
CREATE POLICY "studio_live_gifts_select" ON studio_live_gifts FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Follows: own only
CREATE POLICY "user_follows_select" ON user_follows FOR SELECT USING (follower_id = auth.uid() OR following_id = auth.uid());
CREATE POLICY "user_follows_insert" ON user_follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "user_follows_delete" ON user_follows FOR DELETE USING (follower_id = auth.uid());

-- Blocks: blocker only
CREATE POLICY "user_blocks_all" ON user_blocks FOR ALL USING (blocker_id = auth.uid());
