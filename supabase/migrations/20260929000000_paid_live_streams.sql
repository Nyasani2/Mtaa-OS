
-- Create live_streams table (unified across all MTAA)
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'tribes', 'streets', 'studio', 'education', 'general'
  category_id UUID, -- Reference to the specific context (tribe_id, etc.)
  thumbnail_url TEXT,
  stream_url TEXT, -- RTMP/WebRTC URL
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended'
  is_paid BOOLEAN DEFAULT false,
  access_tiers INTEGER[] DEFAULT ARRAY[10, 20, 50, 100, 500, 1000], -- Tip amounts in KES
  viewer_count INTEGER DEFAULT 0,
  total_tips INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create live_stream_tips table
CREATE TABLE IF NOT EXISTS live_stream_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount IN (10, 20, 50, 100, 500, 1000)),
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create live_stream_viewers table (track who's watching)
CREATE TABLE IF NOT EXISTS live_stream_viewers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  tip_amount INTEGER DEFAULT 0,
  UNIQUE(stream_id, user_id)
);

-- Create live_stream_messages (chat during live)
CREATE TABLE IF NOT EXISTS live_stream_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_moderator BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_creator ON live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_category ON live_streams(category, category_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_tips_stream ON live_stream_tips(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_tips_sender ON live_stream_tips(sender_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_stream ON live_stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_messages_stream ON live_stream_messages(stream_id);

-- Add RLS policies (simplified for Phase 1)
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_messages ENABLE ROW LEVEL SECURITY;

-- Basic policies (to be hardened in Phase 5)
CREATE POLICY "Anyone can view live streams" ON live_streams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create streams" ON live_streams FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator can update their stream" ON live_streams FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view tips" ON live_stream_tips FOR SELECT USING (true);
CREATE POLICY "Authenticated users can tip" ON live_stream_tips FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Anyone can view messages" ON live_stream_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON live_stream_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
