-- MTAA OS — Kernel Consolidation SQL
-- Run this AFTER Phase 0 & 1 are stable

-- ============================================================
-- kernel_events: Unified event persistence
-- ============================================================
CREATE TABLE IF NOT EXISTS kernel_events (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'normal',
  timestamp BIGINT NOT NULL,
  trace_id TEXT NOT NULL,
  source_module TEXT NOT NULL,
  target_modules TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kernel_events_domain ON kernel_events(domain);
CREATE INDEX IF NOT EXISTS idx_kernel_events_type ON kernel_events(type);
CREATE INDEX IF NOT EXISTS idx_kernel_events_timestamp ON kernel_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_kernel_events_trace ON kernel_events(trace_id);

ALTER TABLE kernel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kernel_events_all" ON kernel_events FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- app_manifests: Unified app registry
-- ============================================================
CREATE TABLE IF NOT EXISTS app_manifests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  permissions JSONB DEFAULT '[]',
  routes JSONB DEFAULT '[]',
  dependencies TEXT[] DEFAULT '{}',
  entry_point TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  installable BOOLEAN DEFAULT true,
  system_app BOOLEAN DEFAULT false,
  min_kernel_version TEXT,
  config_schema JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_manifests_domain ON app_manifests(domain);
CREATE INDEX IF NOT EXISTS idx_app_manifests_enabled ON app_manifests(enabled);

ALTER TABLE app_manifests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_manifests_all" ON app_manifests FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- civic_audit_log: Immutable cross-module audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS civic_audit_log (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  delta JSONB,
  timestamp BIGINT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  immutable_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_civic_audit_module ON civic_audit_log(module);
CREATE INDEX IF NOT EXISTS idx_civic_audit_actor ON civic_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_civic_audit_resource ON civic_audit_log(resource_id);
CREATE INDEX IF NOT EXISTS idx_civic_audit_timestamp ON civic_audit_log(timestamp DESC);

ALTER TABLE civic_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "civic_audit_all" ON civic_audit_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- kernel_health_snapshots: Runtime health metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS kernel_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL,
  health_score INTEGER NOT NULL,
  active_apps INTEGER DEFAULT 0,
  event_throughput INTEGER DEFAULT 0,
  uptime_ms BIGINT DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  metrics JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kernel_health_time ON kernel_health_snapshots(recorded_at DESC);

ALTER TABLE kernel_health_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kernel_health_all" ON kernel_health_snapshots FOR ALL USING (true) WITH CHECK (true);
