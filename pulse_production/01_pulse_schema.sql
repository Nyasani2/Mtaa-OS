-- MTAA Pulse — Complete SQL Schema
-- Phase 1: Database Architecture

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Pulse Events — Event ingestion bus (all MTAA modules emit here)
CREATE TABLE IF NOT EXISTS pulse_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('profile','wallet','messenger','feed','streets','jobs','transport','marketplace','education','health','government','pulse')),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user','post','community','job','ride','order','transfer','course','certification','event','business','product')),
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  region TEXT,
  county TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  retry_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_pulse_events_source ON pulse_events(source);
CREATE INDEX idx_pulse_events_type ON pulse_events(event_type);
CREATE INDEX idx_pulse_events_entity ON pulse_events(entity_type, entity_id);
CREATE INDEX idx_pulse_events_user ON pulse_events(user_id);
CREATE INDEX idx_pulse_events_created ON pulse_events(created_at DESC);
CREATE INDEX idx_pulse_events_processed ON pulse_events(processed, created_at);
CREATE INDEX idx_pulse_events_region ON pulse_events(region, county);

-- Pulse Topics — Trending/interest topics
CREATE TABLE IF NOT EXISTS pulse_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('business','technology','culture','politics','sports','education','health','entertainment','science','general')),
  icon_url TEXT,
  follower_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  trending_score NUMERIC NOT NULL DEFAULT 0,
  trending_velocity NUMERIC NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_pulse_topics_slug ON pulse_topics(slug);
CREATE INDEX idx_pulse_topics_category ON pulse_topics(category);
CREATE INDEX idx_pulse_topics_trending ON pulse_topics(trending_score DESC);
CREATE INDEX idx_pulse_topics_featured ON pulse_topics(is_featured, trending_score DESC);

-- Pulse Topic Followers
CREATE TABLE IF NOT EXISTS pulse_topic_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES pulse_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(topic_id, user_id)
);

CREATE INDEX idx_pulse_topic_followers_topic ON pulse_topic_followers(topic_id);
CREATE INDEX idx_pulse_topic_followers_user ON pulse_topic_followers(user_id);

-- Pulse Trends — Computed trending records
CREATE TABLE IF NOT EXISTS pulse_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES pulse_topics(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('creator','business','community','job','product','event','discussion','topic')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  entity_avatar TEXT,
  score NUMERIC NOT NULL DEFAULT 0,
  velocity NUMERIC NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  engagement_count INTEGER NOT NULL DEFAULT 0,
  region TEXT,
  county TEXT,
  period TEXT NOT NULL DEFAULT 'daily' CHECK (period IN ('hourly','daily','weekly','monthly')),
  rank INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_pulse_trends_period ON pulse_trends(period, created_at DESC);
CREATE INDEX idx_pulse_trends_score ON pulse_trends(score DESC);
CREATE INDEX idx_pulse_trends_entity ON pulse_trends(entity_type, entity_id);
CREATE INDEX idx_pulse_trends_region ON pulse_trends(region, score DESC);
CREATE INDEX idx_pulse_trends_featured ON pulse_trends(is_featured, score DESC);

-- Pulse Alerts — System and user alerts
CREATE TABLE IF NOT EXISTS pulse_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('platform','security','emergency','community','government','business','job','transport','weather','health')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical','emergency')),
  source TEXT NOT NULL,
  source_id UUID,
  region TEXT,
  county TEXT,
  lat NUMERIC,
  lng NUMERIC,
  radius_meters INTEGER,
  action_url TEXT,
  action_label TEXT,
  image_url TEXT,
  is_broadcast BOOLEAN NOT NULL DEFAULT FALSE,
  broadcast_audience TEXT DEFAULT 'all' CHECK (broadcast_audience IN ('all','region','county','verified')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_pulse_alerts_type ON pulse_alerts(alert_type, created_at DESC);
CREATE INDEX idx_pulse_alerts_severity ON pulse_alerts(severity, created_at DESC);
CREATE INDEX idx_pulse_alerts_region ON pulse_alerts(region, county, created_at DESC);
CREATE INDEX idx_pulse_alerts_broadcast ON pulse_alerts(is_broadcast, created_at DESC);
CREATE INDEX idx_pulse_alerts_active ON pulse_alerts(deleted_at, end_at);

-- Pulse Alert Deliveries — Per-user alert delivery tracking
CREATE TABLE IF NOT EXISTS pulse_alert_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES pulse_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  channel TEXT NOT NULL DEFAULT 'push' CHECK (channel IN ('push','sms','email','in_app')),
  UNIQUE(alert_id, user_id, channel)
);

CREATE INDEX idx_pulse_alert_deliveries_user ON pulse_alert_deliveries(user_id, delivered_at DESC);
CREATE INDEX idx_pulse_alert_deliveries_alert ON pulse_alert_deliveries(alert_id);

-- Pulse Saved Items — User bookmarks across all MTAA modules
CREATE TABLE IF NOT EXISTS pulse_saved_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('post','job','product','event','business','course','community','creator','article','alert')),
  item_id UUID NOT NULL,
  source_module TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_pulse_saved_items_user ON pulse_saved_items(user_id, created_at DESC);
CREATE INDEX idx_pulse_saved_items_type ON pulse_saved_items(item_type, item_id);

-- Pulse Reports — Content/entity reports
CREATE TABLE IF NOT EXISTS pulse_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post','comment','user','business','product','job','event','community')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed','escalated')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pulse_reports_status ON pulse_reports(status, created_at DESC);
CREATE INDEX idx_pulse_reports_entity ON pulse_reports(entity_type, entity_id);
CREATE INDEX idx_pulse_reports_reporter ON pulse_reports(reporter_id);

-- Pulse Recommendations — Computed recommendations per user
CREATE TABLE IF NOT EXISTS pulse_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rec_type TEXT NOT NULL CHECK (rec_type IN ('topic','community','business','creator','event','job','product','course')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  entity_avatar TEXT,
  reason TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  context JSONB NOT NULL DEFAULT '{}',
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 days'),
  UNIQUE(user_id, rec_type, entity_id)
);

CREATE INDEX idx_pulse_recommendations_user ON pulse_recommendations(user_id, score DESC);
CREATE INDEX idx_pulse_recommendations_type ON pulse_recommendations(rec_type, score DESC);
CREATE INDEX idx_pulse_recommendations_expires ON pulse_recommendations(expires_at);

-- Pulse Analytics — Aggregated metrics snapshots
CREATE TABLE IF NOT EXISTS pulse_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  dimension TEXT,
  dimension_value TEXT,
  region TEXT,
  county TEXT,
  period TEXT NOT NULL DEFAULT 'daily' CHECK (period IN ('hourly','daily','weekly','monthly')),
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pulse_analytics_metric ON pulse_analytics(metric_name, period, snapshot_at DESC);
CREATE INDEX idx_pulse_analytics_region ON pulse_analytics(region, metric_name, snapshot_at DESC);

-- Pulse Creator Scores — Creator ranking/quality scores
CREATE TABLE IF NOT EXISTS pulse_creator_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL DEFAULT 0,
  content_score NUMERIC NOT NULL DEFAULT 0,
  engagement_score NUMERIC NOT NULL DEFAULT 0,
  revenue_score NUMERIC NOT NULL DEFAULT 0,
  community_score NUMERIC NOT NULL DEFAULT 0,
  verification_score NUMERIC NOT NULL DEFAULT 0,
  follower_count INTEGER NOT NULL DEFAULT 0,
  content_count INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_engagement INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  rank_national INTEGER,
  rank_regional INTEGER,
  rank_category TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id)
);

CREATE INDEX idx_pulse_creator_scores_overall ON pulse_creator_scores(overall_score DESC);
CREATE INDEX idx_pulse_creator_scores_rank ON pulse_creator_scores(rank_national);

-- Pulse Entity Rankings — Generic rankings for any entity type
CREATE TABLE IF NOT EXISTS pulse_entity_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('creator','business','community','job','product','event','discussion')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  category TEXT,
  score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  previous_rank INTEGER,
  rank_change INTEGER,
  region TEXT,
  county TEXT,
  period TEXT NOT NULL DEFAULT 'daily' CHECK (period IN ('hourly','daily','weekly','monthly')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(entity_type, entity_id, period, region)
);

CREATE INDEX idx_pulse_entity_rankings_type ON pulse_entity_rankings(entity_type, score DESC);
CREATE INDEX idx_pulse_entity_rankings_period ON pulse_entity_rankings(period, calculated_at DESC);

-- Pulse Event Interactions — User interactions with events
CREATE TABLE IF NOT EXISTS pulse_event_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES pulse_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view','click','share','save','dismiss')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id, interaction_type)
);

CREATE INDEX idx_pulse_event_interactions_event ON pulse_event_interactions(event_id);
CREATE INDEX idx_pulse_event_interactions_user ON pulse_event_interactions(user_id, created_at DESC);

-- Pulse Search Index — Full-text search index
CREATE TABLE IF NOT EXISTS pulse_search_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user','business','community','job','product','event','topic','post','course')),
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_vector TSVECTOR,
  tags TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}',
  region TEXT,
  county TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_pulse_search_index_vector ON pulse_search_index USING GIN(content_vector);
CREATE INDEX idx_pulse_search_index_type ON pulse_search_index(entity_type, is_active);
CREATE INDEX idx_pulse_search_index_tags ON pulse_search_index USING GIN(tags);

-- Pulse Moderation Queue — Content moderation
CREATE TABLE IF NOT EXISTS pulse_moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post','comment','user','business','product','job','event')),
  entity_id UUID NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_reason TEXT NOT NULL,
  report_description TEXT,
  evidence_urls TEXT[],
  ai_score NUMERIC,
  ai_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','flagged','limited','removed','restored','appealed')),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  action_taken TEXT,
  appealed_at TIMESTAMPTZ,
  appeal_reason TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pulse_moderation_status ON pulse_moderation_queue(status, created_at DESC);
CREATE INDEX idx_pulse_moderation_entity ON pulse_moderation_queue(entity_type, entity_id);
CREATE INDEX idx_pulse_moderation_ai ON pulse_moderation_queue(ai_score DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE pulse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_topic_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_alert_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_creator_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_entity_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_event_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_moderation_queue ENABLE ROW LEVEL SECURITY;

-- Pulse Events: All users can view, only system can insert/update
CREATE POLICY "pulse_events_select_all" ON pulse_events FOR SELECT USING (TRUE);
CREATE POLICY "pulse_events_insert_system" ON pulse_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "pulse_events_update_own" ON pulse_events FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Pulse Topics: Public read, admin write
CREATE POLICY "pulse_topics_select_all" ON pulse_topics FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "pulse_topics_insert_admin" ON pulse_topics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "pulse_topics_update_admin" ON pulse_topics FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Pulse Topic Followers: Users manage own follows
CREATE POLICY "pulse_topic_followers_select_own" ON pulse_topic_followers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "pulse_topic_followers_insert_own" ON pulse_topic_followers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "pulse_topic_followers_delete_own" ON pulse_topic_followers FOR DELETE USING (user_id = auth.uid());

-- Pulse Trends: Public read
CREATE POLICY "pulse_trends_select_all" ON pulse_trends FOR SELECT USING (expires_at > NOW());
CREATE POLICY "pulse_trends_insert_system" ON pulse_trends FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Pulse Alerts: Public read for active, delivery tracking per user
CREATE POLICY "pulse_alerts_select_all" ON pulse_alerts FOR SELECT USING (deleted_at IS NULL AND (end_at IS NULL OR end_at > NOW()));
CREATE POLICY "pulse_alerts_insert_admin" ON pulse_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Pulse Alert Deliveries: Users see own deliveries
CREATE POLICY "pulse_alert_deliveries_select_own" ON pulse_alert_deliveries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "pulse_alert_deliveries_insert_own" ON pulse_alert_deliveries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "pulse_alert_deliveries_update_own" ON pulse_alert_deliveries FOR UPDATE USING (user_id = auth.uid());

-- Pulse Saved Items: Users manage own saves
CREATE POLICY "pulse_saved_items_select_own" ON pulse_saved_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "pulse_saved_items_insert_own" ON pulse_saved_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "pulse_saved_items_delete_own" ON pulse_saved_items FOR DELETE USING (user_id = auth.uid());

-- Pulse Reports: Users see own reports, moderators see all
CREATE POLICY "pulse_reports_select_own" ON pulse_reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "pulse_reports_insert_own" ON pulse_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Pulse Recommendations: Users see own recommendations
CREATE POLICY "pulse_recommendations_select_own" ON pulse_recommendations FOR SELECT USING (user_id = auth.uid() AND expires_at > NOW());
CREATE POLICY "pulse_recommendations_update_own" ON pulse_recommendations FOR UPDATE USING (user_id = auth.uid());

-- Pulse Analytics: Public read for aggregated data
CREATE POLICY "pulse_analytics_select_all" ON pulse_analytics FOR SELECT USING (TRUE);
CREATE POLICY "pulse_analytics_insert_system" ON pulse_analytics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Pulse Creator Scores: Public read
CREATE POLICY "pulse_creator_scores_select_all" ON pulse_creator_scores FOR SELECT USING (TRUE);
CREATE POLICY "pulse_creator_scores_insert_system" ON pulse_creator_scores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Pulse Entity Rankings: Public read
CREATE POLICY "pulse_entity_rankings_select_all" ON pulse_entity_rankings FOR SELECT USING (expires_at > NOW());
CREATE POLICY "pulse_entity_rankings_insert_system" ON pulse_entity_rankings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Pulse Event Interactions: Users manage own interactions
CREATE POLICY "pulse_event_interactions_select_own" ON pulse_event_interactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "pulse_event_interactions_insert_own" ON pulse_event_interactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Pulse Search Index: Public read for active items
CREATE POLICY "pulse_search_index_select_all" ON pulse_search_index FOR SELECT USING (is_active = TRUE);
CREATE POLICY "pulse_search_index_insert_system" ON pulse_search_index FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Pulse Moderation Queue: Users see own reports, moderators see all pending
CREATE POLICY "pulse_moderation_select_own" ON pulse_moderation_queue FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "pulse_moderation_insert_own" ON pulse_moderation_queue FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION pulse_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pulse_topics_updated_at BEFORE UPDATE ON pulse_topics
  FOR EACH ROW EXECUTE FUNCTION pulse_update_updated_at();
CREATE TRIGGER pulse_alerts_updated_at BEFORE UPDATE ON pulse_alerts
  FOR EACH ROW EXECUTE FUNCTION pulse_update_updated_at();
CREATE TRIGGER pulse_reports_updated_at BEFORE UPDATE ON pulse_reports
  FOR EACH ROW EXECUTE FUNCTION pulse_update_updated_at();
CREATE TRIGGER pulse_moderation_updated_at BEFORE UPDATE ON pulse_moderation_queue
  FOR EACH ROW EXECUTE FUNCTION pulse_update_updated_at();
CREATE TRIGGER pulse_search_index_updated_at BEFORE UPDATE ON pulse_search_index
  FOR EACH ROW EXECUTE FUNCTION pulse_update_updated_at();

-- Increment topic follower count
CREATE OR REPLACE FUNCTION pulse_increment_topic_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pulse_topics SET follower_count = follower_count + 1 WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pulse_topic_followers_insert AFTER INSERT ON pulse_topic_followers
  FOR EACH ROW EXECUTE FUNCTION pulse_increment_topic_followers();

-- Decrement topic follower count
CREATE OR REPLACE FUNCTION pulse_decrement_topic_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pulse_topics SET follower_count = follower_count - 1 WHERE id = OLD.topic_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pulse_topic_followers_delete AFTER DELETE ON pulse_topic_followers
  FOR EACH ROW EXECUTE FUNCTION pulse_decrement_topic_followers();

-- Soft delete helper
CREATE OR REPLACE FUNCTION pulse_soft_delete(table_name TEXT, record_id UUID)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1', table_name)
  USING record_id;
END;
$$ LANGUAGE plpgsql;
