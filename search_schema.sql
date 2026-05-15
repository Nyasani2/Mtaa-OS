-- ============================================================
-- MTAA Search Engine Schema
-- Full-text search, autocomplete, facets, analytics
-- Requires: pg_trgm extension
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── search_indexes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_indexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  index_type TEXT NOT NULL CHECK (index_type IN ('text', 'trgm', 'vector')),
  language TEXT DEFAULT 'english',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(table_name, column_name, index_type)
);

-- ─── search_logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  config_key TEXT,
  results_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_config ON search_logs(config_key);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_id);

-- ─── search_suggestions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT now(),
  UNIQUE(config_key, suggestion)
);

CREATE INDEX IF NOT EXISTS idx_search_suggestions_config ON search_suggestions(config_key);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_freq ON search_suggestions(frequency DESC);

-- ─── RLS Policies ──────────────────────────────────────────
ALTER TABLE search_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage search indexes"
  ON search_indexes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can view search indexes"
  ON search_indexes FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert search logs"
  ON search_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own search logs"
  ON search_logs FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage suggestions"
  ON search_suggestions FOR ALL USING (true);

-- ─── Core Search Function ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.mtaa_search(
  p_table TEXT,
  p_query TEXT,
  p_columns TEXT[],
  p_weights JSONB DEFAULT '{}',
  p_facets TEXT[] DEFAULT '{}',
  p_fuzzy BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort TEXT DEFAULT 'rank',
  p_order TEXT DEFAULT 'desc',
  p_facet_filters JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  sql_query TEXT;
  where_clause TEXT := '';
  order_clause TEXT;
  facet_query TEXT;
  facet_results JSONB := '{}';
  suggestions TEXT[] := '{}';
  total_count INTEGER;
  col TEXT;
  weight NUMERIC;
  rank_expr TEXT := '';
  facet_key TEXT;
  facet_values TEXT;
BEGIN
  -- Build rank expression from weights
  FOREACH col IN ARRAY p_columns
  LOOP
    weight := COALESCE((p_weights->>col)::NUMERIC, 0.5);
    IF rank_expr != '' THEN rank_expr := rank_expr || ' + '; END IF;
    rank_expr := rank_expr || format(
      'coalesce(similarity(%I::TEXT, %L), 0) * %s',
      col, p_query, weight
    );
  END LOOP;

  -- Build WHERE clause
  where_clause := format(
    '(%s)',
    array_to_string(
      ARRAY(
        SELECT format(
          CASE WHEN p_fuzzy THEN '%I::TEXT %% %L' ELSE '%I::TEXT ILIKE %L' END,
          col, CASE WHEN p_fuzzy THEN p_query ELSE '%' || p_query || '%' END
        )
        FROM unnest(p_columns) AS col
      ),
      ' OR '
    )
  );

  -- Add facet filters
  FOR facet_key, facet_values IN SELECT * FROM jsonb_each_text(p_facet_filters)
  LOOP
    where_clause := where_clause || format(' AND %I = ANY(%L::TEXT[])', facet_key, facet_values);
  END LOOP;

  -- Build ORDER BY
  order_clause := format(
    '%s %s NULLS LAST',
    CASE WHEN p_sort = 'rank' THEN '(' || rank_expr || ')' ELSE p_sort END,
    p_order
  );

  -- Get total count
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE %s', p_table, where_clause) INTO total_count;

  -- Get facet counts
  FOREACH facet_key IN ARRAY p_facets
  LOOP
    EXECUTE format(
      'SELECT jsonb_object_agg(%I, cnt) FROM (SELECT %I, COUNT(*) as cnt FROM %I WHERE %s GROUP BY %I) t',
      facet_key, facet_key, p_table, where_clause, facet_key
    ) INTO facet_results;
  END LOOP;

  -- Get suggestions (top matching distinct values from first column)
  EXECUTE format(
    'SELECT ARRAY(SELECT DISTINCT %I FROM %I WHERE %I::TEXT %% %L ORDER BY %I LIMIT 8)',
    p_columns[1], p_table, p_columns[1], p_query, p_columns[1]
  ) INTO suggestions;

  -- Build final query
  sql_query := format(
    'SELECT jsonb_agg(t) FROM (
      SELECT *, (%s) as search_rank
      FROM %I
      WHERE %s
      ORDER BY %s
      LIMIT %s OFFSET %s
    ) t',
    rank_expr, p_table, where_clause, order_clause, p_limit, p_offset
  );

  EXECUTE sql_query INTO result;

  RETURN jsonb_build_object(
    'items', COALESCE(result, '[]'::JSONB),
    'total', total_count,
    'facets', facet_results,
    'suggestions', suggestions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Autocomplete Function ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.mtaa_autocomplete(
  p_table TEXT,
  p_column TEXT,
  p_prefix TEXT,
  p_limit INTEGER DEFAULT 8
)
RETURNS TEXT[] AS $$
DECLARE
  results TEXT[];
BEGIN
  EXECUTE format(
    'SELECT ARRAY(
      SELECT DISTINCT %I
      FROM %I
      WHERE %I::TEXT ILIKE %L
      ORDER BY %I
      LIMIT %s
    )',
    p_column, p_table, p_column, p_prefix || '%', p_column, p_limit
  ) INTO results;
  RETURN COALESCE(results, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Search Analytics Functions ──────────────────────────

CREATE OR REPLACE FUNCTION public.mtaa_search_avg_results()
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT AVG(results_count)::NUMERIC
    FROM search_logs
    WHERE created_at > now() - INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mtaa_search_top_queries(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(query TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT sl.query, COUNT(*)::BIGINT
  FROM search_logs sl
  WHERE sl.created_at > now() - INTERVAL '30 days'
  GROUP BY sl.query
  ORDER BY COUNT(*) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Suggestion Update Trigger ───────────────────────────

CREATE OR REPLACE FUNCTION public.mtaa_update_suggestions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO search_suggestions (config_key, suggestion, frequency, last_used)
  VALUES (NEW.config_key, NEW.query, 1, now())
  ON CONFLICT (config_key, suggestion)
  DO UPDATE SET frequency = search_suggestions.frequency + 1, last_used = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_search_suggestions ON search_logs;
CREATE TRIGGER trg_search_suggestions
  AFTER INSERT ON search_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.mtaa_update_suggestions();

-- ─── Index Creation Helper ───────────────────────────────

CREATE OR REPLACE FUNCTION public.mtaa_create_search_index(
  p_table TEXT,
  p_column TEXT,
  p_type TEXT DEFAULT 'trgm'
)
RETURNS VOID AS $$
BEGIN
  IF p_type = 'trgm' THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_%s_trgm ON %I USING gin (%I gin_trgm_ops)', p_table, p_column, p_table, p_column);
  ELSIF p_type = 'text' THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_%s_text ON %I USING gin (to_tsvector(%L, %I))', p_table, p_column, p_table, 'english', p_column);
  END IF;

  INSERT INTO search_indexes (table_name, column_name, index_type)
  VALUES (p_table, p_column, p_type)
  ON CONFLICT (table_name, column_name, index_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Create default indexes for existing tables ──────────

SELECT mtaa_create_search_index('profiles', 'full_name', 'trgm');
SELECT mtaa_create_search_index('profiles', 'bio', 'trgm');
SELECT mtaa_create_search_index('civic_projects', 'title', 'trgm');
SELECT mtaa_create_search_index('civic_projects', 'description', 'trgm');
SELECT mtaa_create_search_index('jobs', 'title', 'trgm');
SELECT mtaa_create_search_index('marketplace_listings', 'title', 'trgm');
SELECT mtaa_create_search_index('shop_products', 'name', 'trgm');
SELECT mtaa_create_search_index('tribes', 'name', 'trgm');
SELECT mtaa_create_search_index('education_courses', 'title', 'trgm');
SELECT mtaa_create_search_index('health_facilities', 'name', 'trgm');
SELECT mtaa_create_search_index('app_store_apps', 'name', 'trgm');
SELECT mtaa_create_search_index('bus_messages', 'content', 'trgm');
