-- MStudio Final Architecture Tables (Sections 21-30)

-- 21. Broadcast Networks
CREATE TABLE IF NOT EXISTS studio_broadcasters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tv','radio','university','school','church','government','sports','news','event','corporate')),
  verified BOOLEAN DEFAULT false,
  logo_url TEXT,
  description TEXT,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  stream_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_broadcast_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcaster_id UUID REFERENCES studio_broadcasters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('owner','admin','producer','presenter','camera','editor','moderator')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(broadcaster_id, user_id)
);

-- 22. Long-Duration Live Streams
CREATE TABLE IF NOT EXISTS studio_live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('24h','7d','30d','365d')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','paused','ended')),
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  auto_reconnect BOOLEAN DEFAULT true,
  stream_redundancy BOOLEAN DEFAULT true,
  dvr_enabled BOOLEAN DEFAULT true,
  clip_generation BOOLEAN DEFAULT true,
  health_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 27. Creator Revenue Ledger
CREATE TABLE IF NOT EXISTS studio_creator_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  gross_revenue NUMERIC(12,2) DEFAULT 0,
  platform_commission NUMERIC(12,2) DEFAULT 0,
  government_tax NUMERIC(12,2) DEFAULT 0,
  net_earnings NUMERIC(12,2) DEFAULT 0,
  wallet_deposit NUMERIC(12,2) DEFAULT 0,
  ad_revenue NUMERIC(12,2) DEFAULT 0,
  membership_revenue NUMERIC(12,2) DEFAULT 0,
  tips_revenue NUMERIC(12,2) DEFAULT 0,
  digital_sales NUMERIC(12,2) DEFAULT 0,
  course_revenue NUMERIC(12,2) DEFAULT 0,
  music_revenue NUMERIC(12,2) DEFAULT 0,
  merch_revenue NUMERIC(12,2) DEFAULT 0,
  event_revenue NUMERIC(12,2) DEFAULT 0,
  daily_ad NUMERIC(12,2) DEFAULT 0,
  monthly_ad NUMERIC(12,2) DEFAULT 0,
  annual_ad NUMERIC(12,2) DEFAULT 0,
  daily_membership NUMERIC(12,2) DEFAULT 0,
  monthly_membership NUMERIC(12,2) DEFAULT 0,
  annual_membership NUMERIC(12,2) DEFAULT 0,
  daily_tips NUMERIC(12,2) DEFAULT 0,
  monthly_tips NUMERIC(12,2) DEFAULT 0,
  annual_tips NUMERIC(12,2) DEFAULT 0,
  daily_digital NUMERIC(12,2) DEFAULT 0,
  monthly_digital NUMERIC(12,2) DEFAULT 0,
  annual_digital NUMERIC(12,2) DEFAULT 0,
  daily_course NUMERIC(12,2) DEFAULT 0,
  monthly_course NUMERIC(12,2) DEFAULT 0,
  annual_course NUMERIC(12,2) DEFAULT 0,
  daily_music NUMERIC(12,2) DEFAULT 0,
  monthly_music NUMERIC(12,2) DEFAULT 0,
  annual_music NUMERIC(12,2) DEFAULT 0,
  daily_merch NUMERIC(12,2) DEFAULT 0,
  monthly_merch NUMERIC(12,2) DEFAULT 0,
  annual_merch NUMERIC(12,2) DEFAULT 0,
  daily_event NUMERIC(12,2) DEFAULT 0,
  monthly_event NUMERIC(12,2) DEFAULT 0,
  annual_event NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 28. Revenue Sharing Records
CREATE TABLE IF NOT EXISTS studio_revenue_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  gross_amount NUMERIC(12,2) DEFAULT 0,
  platform_rate NUMERIC(5,2) DEFAULT 10.00,
  tax_rate NUMERIC(5,2) DEFAULT 5.00,
  platform_amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  creator_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','settled','disputed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 28. Payout Requests
CREATE TABLE IF NOT EXISTS studio_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','processed')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE studio_broadcasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_broadcast_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_creator_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_revenue_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broadcasters_select_all" ON studio_broadcasters FOR SELECT USING (true);
CREATE POLICY "broadcasters_insert_own" ON studio_broadcasters FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "broadcasters_update_own" ON studio_broadcasters FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "broadcast_members_select" ON studio_broadcast_members FOR SELECT USING (true);
CREATE POLICY "broadcast_members_insert" ON studio_broadcast_members FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "live_streams_select" ON studio_live_streams FOR SELECT USING (true);
CREATE POLICY "live_streams_insert_own" ON studio_live_streams FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "live_streams_update_own" ON studio_live_streams FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "creator_revenue_select_own" ON studio_creator_revenue FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "creator_revenue_insert" ON studio_creator_revenue FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "revenue_shares_select_own" ON studio_revenue_shares FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "revenue_shares_insert" ON studio_revenue_shares FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "payout_requests_select_own" ON studio_payout_requests FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "payout_requests_insert_own" ON studio_payout_requests FOR INSERT WITH CHECK (creator_id = auth.uid());
