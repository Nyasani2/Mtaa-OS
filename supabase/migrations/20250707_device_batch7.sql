-- ============================================================
-- MTAA Device Platform Schema — Batch 7 (Additional)
-- ============================================================
BEGIN;

-- BODYCAM SESSIONS
CREATE TABLE IF NOT EXISTS bodycam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL,
  officer_name TEXT NOT NULL,
  badge_number TEXT,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'emergency')),
  recording_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  incident_count INTEGER DEFAULT 0,
  gps_trace JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bodycam_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bodycam_select_officer" ON bodycam_sessions;
CREATE POLICY "bodycam_select_officer" ON bodycam_sessions FOR SELECT USING (
  auth.uid() = bodycam_sessions.officer_id
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'police_officer', 'fleet_manager'))
);

DROP POLICY IF EXISTS "bodycam_insert_officer" ON bodycam_sessions;
CREATE POLICY "bodycam_insert_officer" ON bodycam_sessions FOR INSERT WITH CHECK (
  auth.uid() = bodycam_sessions.officer_id
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
);

DROP POLICY IF EXISTS "bodycam_update_officer" ON bodycam_sessions;
CREATE POLICY "bodycam_update_officer" ON bodycam_sessions FOR UPDATE USING (
  auth.uid() = bodycam_sessions.officer_id
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
);

-- SHIFT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL,
  vehicle_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  bodycam_device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ,
  patrol_area TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed')),
  handover_notes TEXT,
  supervisor_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shift_select_officer" ON shift_assignments;
CREATE POLICY "shift_select_officer" ON shift_assignments FOR SELECT USING (
  auth.uid() = shift_assignments.officer_id
  OR auth.uid() = shift_assignments.supervisor_id
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'police_officer', 'fleet_manager'))
);

DROP POLICY IF EXISTS "shift_insert_admin" ON shift_assignments;
CREATE POLICY "shift_insert_admin" ON shift_assignments FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'police_officer'))
);

-- DRIVER SCORES
CREATE TABLE IF NOT EXISTS driver_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  vehicle_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
  efficiency_score INTEGER CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  harsh_events_count INTEGER DEFAULT 0,
  speeding_events_count INTEGER DEFAULT 0,
  braking_events_count INTEGER DEFAULT 0,
  cornering_events_count INTEGER DEFAULT 0,
  total_distance_km NUMERIC DEFAULT 0,
  total_driving_hours NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, period_start)
);

ALTER TABLE driver_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_scores_select" ON driver_scores;
CREATE POLICY "driver_scores_select" ON driver_scores FOR SELECT USING (
  auth.uid() = driver_scores.driver_id
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'insurance_agent'))
);

DROP POLICY IF EXISTS "driver_scores_insert_system" ON driver_scores;
CREATE POLICY "driver_scores_insert_system" ON driver_scores FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
);

-- DEVICE LOGS
CREATE TABLE IF NOT EXISTS device_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  log_level TEXT NOT NULL CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'critical')),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE device_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_logs_select_admin" ON device_logs;
CREATE POLICY "device_logs_select_admin" ON device_logs FOR SELECT USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
  OR auth.uid() IN (SELECT assigned_user_id FROM device_assignments WHERE device_id = device_logs.device_id)
);

DROP POLICY IF EXISTS "device_logs_insert_any" ON device_logs;
CREATE POLICY "device_logs_insert_any" ON device_logs FOR INSERT WITH CHECK (true);

-- FIRMWARE VERSIONS
CREATE TABLE IF NOT EXISTS firmware_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type TEXT NOT NULL,
  version TEXT NOT NULL,
  release_notes TEXT,
  file_path TEXT,
  file_size_bytes BIGINT,
  checksum TEXT,
  is_stable BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  min_hardware_version TEXT,
  release_date TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_type, version)
);

ALTER TABLE firmware_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "firmware_select_all" ON firmware_versions;
CREATE POLICY "firmware_select_all" ON firmware_versions FOR SELECT USING (true);

DROP POLICY IF EXISTS "firmware_insert_admin" ON firmware_versions;
CREATE POLICY "firmware_insert_admin" ON firmware_versions FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
);

-- OBD DIAGNOSTICS
CREATE TABLE IF NOT EXISTS obd_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  scanner_device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  scan_date TIMESTAMPTZ DEFAULT NOW(),
  fault_codes JSONB DEFAULT '[]',
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'requires_attention')),
  mileage_at_scan INTEGER,
  fuel_level_percent INTEGER CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
  engine_temp_celsius INTEGER,
  battery_voltage NUMERIC,
  recommended_action TEXT,
  estimated_repair_cost NUMERIC,
  mechanic_notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE obd_diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "obd_select_mechanic" ON obd_diagnostics;
CREATE POLICY "obd_select_mechanic" ON obd_diagnostics FOR SELECT USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
  OR auth.uid() IN (SELECT assigned_user_id FROM device_assignments WHERE device_id = obd_diagnostics.scanner_device_id)
);

DROP POLICY IF EXISTS "obd_insert_mechanic" ON obd_diagnostics;
CREATE POLICY "obd_insert_mechanic" ON obd_diagnostics FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

DROP POLICY IF EXISTS "obd_update_mechanic" ON obd_diagnostics;
CREATE POLICY "obd_update_mechanic" ON obd_diagnostics FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

-- REPAIR RECORDS
CREATE TABLE IF NOT EXISTS repair_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  diagnostic_id UUID REFERENCES obd_diagnostics(id) ON DELETE SET NULL,
  repair_type TEXT NOT NULL CHECK (repair_type IN ('preventive', 'corrective', 'emergency', 'warranty', 'upgrade')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'warranty_claim')),
  description TEXT NOT NULL,
  parts_used JSONB DEFAULT '[]',
  labor_hours NUMERIC,
  cost_parts NUMERIC,
  cost_labor NUMERIC,
  total_cost NUMERIC,
  photos TEXT[] DEFAULT '{}',
  mechanic_id UUID,
  garage_id UUID,
  completed_at TIMESTAMPTZ,
  warranty_months INTEGER,
  next_service_due DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE repair_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repair_select_participants" ON repair_records;
CREATE POLICY "repair_select_participants" ON repair_records FOR SELECT USING (
  auth.uid() = repair_records.mechanic_id
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

DROP POLICY IF EXISTS "repair_insert_mechanic" ON repair_records;
CREATE POLICY "repair_insert_mechanic" ON repair_records FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

-- FLEET ALERTS
CREATE TABLE IF NOT EXISTS fleet_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'camera_disconnected', 'storage_full', 'battery_low', 'recording_stopped',
    'crash_detected', 'evidence_uploaded', 'firmware_available', 'camera_malfunction',
    'device_offline', 'device_error', 'signal_weak', 'health_degraded'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  driver_id UUID,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fleet_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fleet_alerts_select_all" ON fleet_alerts;
CREATE POLICY "fleet_alerts_select_all" ON fleet_alerts FOR SELECT USING (
  auth.uid() = fleet_alerts.driver_id
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

DROP POLICY IF EXISTS "fleet_alerts_insert_system" ON fleet_alerts;
CREATE POLICY "fleet_alerts_insert_system" ON fleet_alerts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "fleet_alerts_ack_admin" ON fleet_alerts;
CREATE POLICY "fleet_alerts_ack_admin" ON fleet_alerts FOR UPDATE USING (
  auth.uid() = fleet_alerts.driver_id
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

-- REALTIME
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE bodycam_sessions;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'bodycam_sessions already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE shift_assignments;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'shift_assignments already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE driver_scores;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'driver_scores already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE device_logs;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'device_logs already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE obd_diagnostics;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'obd_diagnostics already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE fleet_alerts;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'fleet_alerts already in publication';
END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_bodycam_officer ON bodycam_sessions(officer_id);
CREATE INDEX IF NOT EXISTS idx_bodycam_device ON bodycam_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_bodycam_status ON bodycam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_shift_officer ON shift_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_shift_vehicle ON shift_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_driver_scores_driver ON driver_scores(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_scores_period ON driver_scores(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_device_logs_device ON device_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_level ON device_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_obd_vehicle ON obd_diagnostics(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_repair_vehicle ON repair_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_alerts_type ON fleet_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_fleet_alerts_unack ON fleet_alerts(acknowledged) WHERE NOT acknowledged;

COMMIT;
