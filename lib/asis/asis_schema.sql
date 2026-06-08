-- ASIS v1 - Supabase SQL Schema
-- Tables for sessions, memory, rate limits, usage tracking, and provider status

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ASIS Sessions: Short-term conversation history
CREATE TABLE IF NOT EXISTS asis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'asis', 'system')),
  content TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT asis_sessions_user_session UNIQUE (user_id, session_id, created_at)
);

CREATE INDEX idx_asis_sessions_user_id ON asis_sessions(user_id);
CREATE INDEX idx_asis_sessions_session_id ON asis_sessions(session_id);
CREATE INDEX idx_asis_sessions_created_at ON asis_sessions(created_at DESC);

-- ASIS Memory: Long-term facts, preferences, patterns (with vector embeddings)
CREATE TABLE IF NOT EXISTS asis_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('preference', 'fact', 'pattern', 'goal', 'relationship')),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI/Kimi embedding dimension
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_count INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_asis_memory_user_id ON asis_memory(user_id);
CREATE INDEX idx_asis_memory_type ON asis_memory(type);
CREATE INDEX idx_asis_memory_embedding ON asis_memory USING ivfflat (embedding vector_cosine_ops);

-- ASIS Rate Limits: Per-user request throttling
CREATE TABLE IF NOT EXISTS asis_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start INTEGER NOT NULL, -- Unix timestamp of current window start
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ASIS Usage: Billing and analytics tracking
CREATE TABLE IF NOT EXISTS asis_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL DEFAULT 'general',
  provider TEXT NOT NULL DEFAULT 'kimi',
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC(10,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asis_usage_user_id ON asis_usage(user_id);
CREATE INDEX idx_asis_usage_created_at ON asis_usage(created_at DESC);
CREATE INDEX idx_asis_usage_domain ON asis_usage(domain);

-- ASIS Provider Status: Health monitoring for AI providers
CREATE TABLE IF NOT EXISTS asis_provider_status (
  provider TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  latency_ms INTEGER,
  error_rate NUMERIC(5,4),
  last_check TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default providers
INSERT INTO asis_provider_status (provider, status, latency_ms) VALUES
  ('kimi', 'healthy', 200),
  ('openai', 'healthy', 300),
  ('claude', 'healthy', 400)
ON CONFLICT (provider) DO NOTHING;

-- ASIS User Stats: Aggregated user interaction statistics
CREATE TABLE IF NOT EXISTS asis_user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  top_domains TEXT[] DEFAULT '{}',
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security Policies
ALTER TABLE asis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asis_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE asis_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE asis_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE asis_user_stats ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY asis_sessions_user_isolation ON asis_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY asis_memory_user_isolation ON asis_memory
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY asis_rate_limits_user_isolation ON asis_rate_limits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY asis_usage_user_isolation ON asis_usage
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY asis_user_stats_user_isolation ON asis_user_stats
  FOR ALL USING (auth.uid() = user_id);

-- Functions for memory management

-- Function to search memories by vector similarity
CREATE OR REPLACE FUNCTION search_asis_memories(
  query_user_id UUID,
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE(
  id UUID,
  type TEXT,
  content TEXT,
  confidence NUMERIC,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    asis_memory.id,
    asis_memory.type,
    asis_memory.content,
    asis_memory.confidence,
    1 - (asis_memory.embedding <=> query_embedding) AS similarity
  FROM asis_memory
  WHERE asis_memory.user_id = query_user_id
    AND 1 - (asis_memory.embedding <=> query_embedding) > match_threshold
  ORDER BY asis_memory.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to update memory access patterns
CREATE OR REPLACE FUNCTION update_memory_access(
  memory_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE asis_memory
  SET 
    access_count = access_count + 1,
    last_accessed = now()
  WHERE id = memory_id;
END;
$$;

-- Function to prune old short-term sessions (keep last 30 days)
CREATE OR REPLACE FUNCTION prune_asis_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM asis_sessions
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Function to get daily usage summary
CREATE OR REPLACE FUNCTION get_asis_daily_usage(
  query_user_id UUID,
  query_date DATE
)
RETURNS TABLE(
  domain TEXT,
  total_tokens INTEGER,
  total_cost NUMERIC,
  request_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    asis_usage.domain,
    SUM(asis_usage.total_tokens)::INTEGER AS total_tokens,
    SUM(asis_usage.cost)::NUMERIC AS total_cost,
    COUNT(*)::BIGINT AS request_count
  FROM asis_usage
  WHERE asis_usage.user_id = query_user_id
    AND DATE(asis_usage.created_at) = query_date
  GROUP BY asis_usage.domain;
END;
$$;

-- Triggers for automatic stats updates
CREATE OR REPLACE FUNCTION update_asis_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO asis_user_stats (user_id, total_messages, last_active)
  VALUES (NEW.user_id, 1, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_messages = asis_user_stats.total_messages + 1,
    last_active = now(),
    updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER asis_sessions_stats_trigger
  AFTER INSERT ON asis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_asis_user_stats();

-- Grant necessary permissions
GRANT ALL ON asis_sessions TO authenticated;
GRANT ALL ON asis_memory TO authenticated;
GRANT ALL ON asis_rate_limits TO authenticated;
GRANT ALL ON asis_usage TO authenticated;
GRANT ALL ON asis_user_stats TO authenticated;
GRANT ALL ON asis_provider_status TO authenticated;

GRANT EXECUTE ON FUNCTION search_asis_memories TO authenticated;
GRANT EXECUTE ON FUNCTION update_memory_access TO authenticated;
GRANT EXECUTE ON FUNCTION prune_asis_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_asis_daily_usage TO authenticated;
