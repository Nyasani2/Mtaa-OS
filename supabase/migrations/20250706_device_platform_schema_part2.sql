-- ============================================================
-- MTAA Device Platform — Additional Schema Tables
-- Batch 7: bodycam_sessions, shift_assignments, driver_scores, device_logs, firmware_versions
-- ============================================================

-- ============================================
-- BODYCAM SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS bodycam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  shift_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'emergency')),
  recording_count INTEGER DEFAULT 0,
  emergency_activations INTEGER DEFAULT 0,
  auto_upload_enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bodycam_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bodycam_select_officer" ON bodycam_sessions;
CREATE POLICY "bodycam_select_officer" ON bodycam_sessions FOR SELECT USING (
  auth.uid() = officer_id
  OR auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'police_officer', 'supervisor'))
);

DROP POLICY IF EXISTS "bodycam_insert_officer" ON bodycam_sessions;
CREATE POLICY "bodycam_insert_officer" ON bodycam_sessions FOR INSERT WITH CHECK (auth.uid() = officer_id);

DROP POLICY IF EXISTS "bodycam_update_officer" ON bodycam_sessions;
CREATE POLICY "bodycam_update_officer" ON bodycam_sessions FOR UPDATE USING (
  auth.uid() = officer_id
  OR auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'supervisor'))
);

-- ============================================
-- SHIFT ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ,
  vehicle_id UUID REFERENCES trucks(id),
  beat_area TEXT,
  supervisor_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shift_select_officer" ON shift_assignments;
CREATE POLICY "shift_select_officer" ON shift_assignments FOR SELECT USING (
  auth.uid() = officer_id
  OR auth.uid() = supervisor_id
  OR auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'supervisor'))
);

DROP POLICY IF EXISTS "shift_insert_admin" ON shift_assignments;
CREATE POLICY "shift_insert_admin" ON shift_assignments FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'supervisor'))
);

-- ============================================
-- DRIVER SCORES
-- ============================================
CREATE TABLE IF NOT EXISTS driver_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES trucks(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
  smoothness_score INTEGER CHECK (smoothness_score >= 0 AND smoothness_score <= 100),
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  efficiency_score INTEGER CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  incident_count INTEGER DEFAULT 0,
  harsh_braking_count INTEGER DEFAULT 0,
  harsh_acceleration_count INTEGER DEFAULT 0,
  harsh_cornering_count INTEGER DEFAULT 0,
  overspeed_count INTEGER DEFAULT 0,
  total_distance_km NUMERIC,
  total_driving_hours NUMERIC,
  fatigue_alerts INTEGER DEFAULT 0,
  phone_usage_count INTEGER DEFAULT 0,
  seatbelt_violations INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, period_start)
);

ALTER TABLE driver_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_scores_select" ON driver_scores;
CREATE POLICY "driver_scores_select" ON driver_scores FOR SELECT USING (
  auth.uid() = driver_id
  OR auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
);

DROP POLICY IF EXISTS "driver_scores_insert_system" ON driver_scores;
CREATE POLICY "driver_scores_insert_system" ON driver_scores FOR INSERT WITH CHECK (true);

-- ============================================
-- DEVICE LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS device_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE device_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_logs_select_admin" ON device_logs;
CREATE POLICY "device_logs_select_admin" ON device_logs FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
);

DROP POLICY IF EXISTS "device_logs_insert_any" ON device_logs;
CREATE POLICY "device_logs_insert_any" ON device_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- FIRMWARE VERSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS firmware_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type TEXT NOT NULL,
  version TEXT NOT NULL,
  release_notes TEXT,
  file_path TEXT,
  is_latest BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,
  min_hardware_version TEXT,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_type, version)
);

ALTER TABLE firmware_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "firmware_select_all" ON firmware_versions;
CREATE POLICY "firmware_select_all" ON firmware_versions FOR SELECT USING (true);

DROP POLICY IF EXISTS "firmware_insert_admin" ON firmware_versions;
CREATE POLICY "firmware_insert_admin" ON firmware_versions FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE role = 'admin')
);

-- ============================================
-- REALTIME
-- ============================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE bodycam_sessions;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'bodycam_sessions already in publication'; END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE driver_scores;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'driver_scores already in publication'; END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE device_logs;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'device_logs already in publication'; END $$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bodycam_officer ON bodycam_sessions(officer_id, status);
CREATE INDEX IF NOT EXISTS idx_bodycam_device ON bodycam_sessions(device_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_shift_officer ON shift_assignments(officer_id, shift_start DESC);
CREATE INDEX IF NOT EXISTS idx_driver_scores_driver ON driver_scores(driver_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_device_logs_device ON device_logs(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_firmware_type ON firmware_versions(device_type, is_latest);
