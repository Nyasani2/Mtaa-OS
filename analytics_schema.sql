-- ============================================================
-- MTAA Analytics Engine Schema
-- Event tracking, metrics, dashboards, reports
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── analytics_events ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID,
  app_id TEXT,
  page TEXT,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_app ON analytics_events(app_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- ─── analytics_dashboards ──────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  widgets JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_owner ON analytics_dashboards(owner_id);

-- ─── analytics_reports ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  metric_keys TEXT[] DEFAULT '{}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  format TEXT DEFAULT 'json',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─── RLS Policies ──────────────────────────────────────────
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert analytics events"
  ON analytics_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can view their own events"
  ON analytics_events FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their dashboards"
  ON analytics_dashboards FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all dashboards"
  ON analytics_dashboards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can manage their reports"
  ON analytics_reports FOR ALL USING (created_by = auth.uid());

-- ─── Metric Query Function ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.mtaa_get_metric(
  p_table TEXT,
  p_aggregation TEXT,
  p_column TEXT DEFAULT 'id',
  p_filter JSONB DEFAULT '{}',
  p_group_by TEXT DEFAULT NULL,
  p_interval TEXT DEFAULT 'day',
  p_start TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  p_end TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  current_value NUMERIC;
  previous_value NUMERIC;
  time_series JSONB;
  sql_query TEXT;
  where_clause TEXT := format('timestamp BETWEEN %L AND %L', p_start, p_end);
  prev_start TIMESTAMPTZ;
  prev_end TIMESTAMPTZ;
  interval_length INTERVAL;
BEGIN
  -- Build filter clause
  IF p_filter != '{}' THEN
    where_clause := where_clause || ' AND ' || (
      SELECT string_agg(
        format('%I = %L', key, value),
        ' AND '
      )
      FROM jsonb_each_text(p_filter)
    );
  END IF;

  -- Calculate current value
  IF p_aggregation = 'count' THEN
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE %s', p_table, where_clause) INTO current_value;
  ELSIF p_aggregation = 'sum' THEN
    EXECUTE format('SELECT COALESCE(SUM(%I), 0) FROM %I WHERE %s', p_column, p_table, where_clause) INTO current_value;
  ELSIF p_aggregation = 'avg' THEN
    EXECUTE format('SELECT COALESCE(AVG(%I), 0) FROM %I WHERE %s', p_column, p_table, where_clause) INTO current_value;
  ELSIF p_aggregation = 'unique' THEN
    EXECUTE format('SELECT COUNT(DISTINCT %I) FROM %I WHERE %s', p_column, p_table, where_clause) INTO current_value;
  ELSE
    current_value := 0;
  END IF;

  -- Calculate previous period
  interval_length := p_end - p_start;
  prev_start := p_start - interval_length;
  prev_end := p_start;

  IF p_aggregation = 'count' THEN
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE timestamp BETWEEN %L AND %L', p_table, prev_start, prev_end) INTO previous_value;
  ELSIF p_aggregation = 'sum' THEN
    EXECUTE format('SELECT COALESCE(SUM(%I), 0) FROM %I WHERE timestamp BETWEEN %L AND %L', p_column, p_table, prev_start, prev_end) INTO previous_value;
  ELSIF p_aggregation = 'avg' THEN
    EXECUTE format('SELECT COALESCE(AVG(%I), 0) FROM %I WHERE timestamp BETWEEN %L AND %L', p_column, p_table, prev_start, prev_end) INTO previous_value;
  ELSIF p_aggregation = 'unique' THEN
    EXECUTE format('SELECT COUNT(DISTINCT %I) FROM %I WHERE timestamp BETWEEN %L AND %L', p_column, p_table, prev_start, prev_end) INTO previous_value;
  ELSE
    previous_value := 0;
  END IF;

  -- Build time series
  sql_query := format(
    'SELECT jsonb_agg(jsonb_build_object(''timestamp'', ts, ''value'', COALESCE(v, 0))) FROM (
      SELECT date_trunc(%L, timestamp) as ts, %s as v
      FROM %I
      WHERE %s
      GROUP BY date_trunc(%L, timestamp)
      ORDER BY ts
    ) t',
    p_interval,
    CASE p_aggregation
      WHEN 'count' THEN 'COUNT(*)'
      WHEN 'sum' THEN format('SUM(%I)', p_column)
      WHEN 'avg' THEN format('AVG(%I)', p_column)
      WHEN 'unique' THEN format('COUNT(DISTINCT %I)', p_column)
      ELSE 'COUNT(*)'
    END,
    p_table,
    where_clause,
    p_interval
  );

  EXECUTE sql_query INTO time_series;

  RETURN jsonb_build_object(
    'value', COALESCE(current_value, 0),
    'previousValue', COALESCE(previous_value, 0),
    'change', COALESCE(current_value, 0) - COALESCE(previous_value, 0),
    'changePercent', CASE WHEN COALESCE(previous_value, 0) = 0 THEN 0 ELSE ROUND(((COALESCE(current_value, 0) - COALESCE(previous_value, 0)) / previous_value * 100)::NUMERIC, 2) END,
    'timeSeries', COALESCE(time_series, '[]'::JSONB)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Realtime Metrics Function ───────────────────────────

CREATE OR REPLACE FUNCTION public.mtaa_realtime_metrics()
RETURNS JSONB AS $$
DECLARE
  online_users INTEGER;
  active_sessions INTEGER;
  tx_per_min INTEGER;
  msgs_per_min INTEGER;
  searches_per_min INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO online_users
  FROM user_sessions
  WHERE last_active > now() - INTERVAL '5 minutes';

  SELECT COUNT(*) INTO active_sessions
  FROM user_sessions
  WHERE last_active > now() - INTERVAL '5 minutes';

  SELECT COUNT(*) INTO tx_per_min
  FROM transactions
  WHERE created_at > now() - INTERVAL '1 minute';

  SELECT COUNT(*) INTO msgs_per_min
  FROM bus_messages
  WHERE created_at > now() - INTERVAL '1 minute';

  SELECT COUNT(*) INTO searches_per_min
  FROM search_logs
  WHERE created_at > now() - INTERVAL '1 minute';

  RETURN jsonb_build_object(
    'onlineUsers', COALESCE(online_users, 0),
    'activeSessions', COALESCE(active_sessions, 0),
    'transactionsPerMinute', COALESCE(tx_per_min, 0),
    'messagesPerMinute', COALESCE(msgs_per_min, 0),
    'searchesPerMinute', COALESCE(searches_per_min, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Funnel Analysis Function ────────────────────────────

CREATE OR REPLACE FUNCTION public.mtaa_funnel_analysis(
  p_steps JSONB,
  p_period TEXT DEFAULT 'day'
)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '[]'::JSONB;
  step JSONB;
  step_num INTEGER := 0;
  prev_count INTEGER := 0;
  current_count INTEGER;
  step_event TEXT;
  step_filter JSONB;
BEGIN
  FOR step IN SELECT * FROM jsonb_array_elements(p_steps)
  LOOP
    step_num := step_num + 1;
    step_event := step->>'event';
    step_filter := COALESCE(step->'filter', '{}'::JSONB);

    EXECUTE format(
      'SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE event_name = %L AND timestamp > now() - INTERVAL %L',
      step_event, '1 ' || p_period
    ) INTO current_count;

    result := result || jsonb_build_object(
      'step', step_num,
      'event', step_event,
      'count', current_count,
      'conversionRate', CASE WHEN prev_count = 0 THEN 100 ELSE ROUND((current_count::NUMERIC / prev_count * 100)::NUMERIC, 2) END,
      'dropOffRate', CASE WHEN prev_count = 0 THEN 0 ELSE ROUND(((prev_count - current_count)::NUMERIC / prev_count * 100)::NUMERIC, 2) END
    );

    prev_count := current_count;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Retention Analysis Function ─────────────────────────

CREATE OR REPLACE FUNCTION public.mtaa_retention_analysis(
  p_cohort_date TIMESTAMPTZ,
  p_periods INTEGER DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '[]'::JSONB;
  period INTEGER;
  cohort_users INTEGER;
  retained INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO cohort_users
  FROM profiles
  WHERE created_at BETWEEN p_cohort_date AND p_cohort_date + INTERVAL '1 day';

  FOR period IN 1..p_periods
  LOOP
    SELECT COUNT(DISTINCT a.user_id) INTO retained
    FROM analytics_events a
    INNER JOIN profiles p ON p.user_id = a.user_id
    WHERE p.created_at BETWEEN p_cohort_date AND p_cohort_date + INTERVAL '1 day'
      AND a.timestamp BETWEEN p_cohort_date + (period || ' days')::INTERVAL
                          AND p_cohort_date + ((period + 1) || ' days')::INTERVAL;

    result := result || jsonb_build_object(
      'period', period,
      'retained', retained,
      'retentionRate', CASE WHEN cohort_users = 0 THEN 0 ELSE ROUND((retained::NUMERIC / cohort_users * 100)::NUMERIC, 2) END
    );
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
