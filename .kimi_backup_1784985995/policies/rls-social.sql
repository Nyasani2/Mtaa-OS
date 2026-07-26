-- MTAA OS V10 — RLS Policies: SOCIAL (Streets, Messenger, Profile, Tribes)

-- streets_posts: creator can edit/delete, public read for public visibility
ALTER TABLE streets_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS streets_posts_creator ON streets_posts;
CREATE POLICY streets_posts_creator ON streets_posts
  FOR ALL USING (creator_id = auth.uid());
DROP POLICY IF EXISTS streets_posts_public ON streets_posts;
CREATE POLICY streets_posts_public ON streets_posts FOR SELECT USING (visibility = 'public');

-- streets_comments: author can edit/delete, public read
ALTER TABLE streets_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS streets_comments_author ON streets_comments;
CREATE POLICY streets_comments_author ON streets_comments
  FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS streets_comments_public ON streets_comments;
CREATE POLICY streets_comments_public ON streets_comments FOR SELECT USING (true);

-- streets_likes: user isolation
ALTER TABLE streets_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS streets_likes_user ON streets_likes;
CREATE POLICY streets_likes_user ON streets_likes
  FOR ALL USING (user_id = auth.uid());

-- messenger_threads: participants only
ALTER TABLE messenger_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messenger_threads_participants ON messenger_threads;
CREATE POLICY messenger_threads_participants ON messenger_threads
  FOR ALL USING (id IN (
    SELECT thread_id FROM messenger_participants WHERE user_id = auth.uid()
  ));

-- messenger_messages: participants only
ALTER TABLE messenger_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messenger_messages_participants ON messenger_messages;
CREATE POLICY messenger_messages_participants ON messenger_messages
  FOR ALL USING (thread_id IN (
    SELECT thread_id FROM messenger_participants WHERE user_id = auth.uid()
  ));

-- messenger_participants: self only
ALTER TABLE messenger_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messenger_participants_self ON messenger_participants;
CREATE POLICY messenger_participants_self ON messenger_participants
  FOR ALL USING (user_id = auth.uid());

-- messenger_attachments: via message access
ALTER TABLE messenger_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messenger_attachments_via_message ON messenger_attachments;
CREATE POLICY messenger_attachments_via_message ON messenger_attachments
  FOR ALL USING (message_id IN (
    SELECT id FROM messenger_messages WHERE thread_id IN (
      SELECT thread_id FROM messenger_participants WHERE user_id = auth.uid()
    )
  ));

-- messenger_read_receipts: self only
ALTER TABLE messenger_read_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messenger_read_receipts_self ON messenger_read_receipts;
CREATE POLICY messenger_read_receipts_self ON messenger_read_receipts
  FOR ALL USING (user_id = auth.uid());

-- creator_earnings: owner only
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS creator_earnings_owner ON creator_earnings;
CREATE POLICY creator_earnings_owner ON creator_earnings
  FOR ALL USING (user_id = auth.uid());

-- user_friendships: participants only
ALTER TABLE user_friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_friendships_participants ON user_friendships;
CREATE POLICY user_friendships_participants ON user_friendships
  FOR ALL USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- user_2fa: owner only
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_2fa_owner ON user_2fa;
CREATE POLICY user_2fa_owner ON user_2fa
  FOR ALL USING (user_id = auth.uid());

-- user_themes: owner only
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_themes_owner ON user_themes;
CREATE POLICY user_themes_owner ON user_themes
  FOR ALL USING (user_id = auth.uid());

-- user_streaming_sessions: owner only
ALTER TABLE user_streaming_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_streaming_sessions_owner ON user_streaming_sessions;
CREATE POLICY user_streaming_sessions_owner ON user_streaming_sessions
  FOR ALL USING (user_id = auth.uid());
