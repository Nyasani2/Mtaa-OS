-- ============================================================
-- MTAA Device Platform Schema — Batch 1 (Core)
-- ============================================================
BEGIN;

-- DEVICES
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN (
    'front_dashcam', 'rear_dashcam', 'cabin_camera', 'side_camera',
    'trailer_camera', 'body_camera', 'helmet_camera', 'inspection_camera',
    'tow_camera', 'ambulance_camera', 'fire_camera', 'evidence_camera',
    'phone_dashcam', 'cargo_camera', 'roof_camera'
  )),
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  firmware_version TEXT,
  mac_address TEXT,
  connection_type TEXT NOT NULL DEFAULT 'bluetooth' CHECK (connection_type IN (
    'bluetooth', 'wifi', 'usb', 'phone_camera', 'oem_integration'
  )),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN (
    'online', 'offline', 'pairing', 'error', 'maintenance', 'retired'
  )),
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  storage_remaining_gb NUMERIC,
  storage_total_gb NUMERIC,
  signal_strength INTEGER CHECK (signal_strength >= 0 AND signal_strength <= 100),
  connection_quality TEXT CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor', 'none')),
  last_sync_at TIMESTAMPTZ,
  gps_available BOOLEAN DEFAULT false,
  camera_health TEXT DEFAULT 'healthy' CHECK (camera_health IN ('healthy', 'degraded', 'failed', 'unknown')),
  resolution_preference TEXT DEFAULT '1080p',
  frame_rate INTEGER DEFAULT 30,
  audio_enabled BOOLEAN DEFAULT true,
  microphone_enabled BOOLEAN DEFAULT true,
  auto_upload BOOLEAN DEFAULT false,
  wifi_only_upload BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT true,
  certificate_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "devices_select_all" ON devices;
CREATE POLICY "devices_select_all" ON devices FOR SELECT USING (true);

DROP POLICY IF EXISTS "devices_insert_admin" ON devices;
CREATE POLICY "devices_insert_admin" ON devices FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

DROP POLICY IF EXISTS "devices_update_assigned" ON devices;
CREATE POLICY "devices_update_assigned" ON devices FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
  OR auth.uid() IN (SELECT assigned_user_id FROM device_assignments WHERE device_id = devices.id)
);

-- DEVICE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS device_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  assigned_type TEXT NOT NULL CHECK (assigned_type IN ('vehicle', 'driver', 'officer', 'ambulance', 'garage')),
  assigned_vehicle_id UUID,
  assigned_user_id UUID,
  assigned_officer_id UUID,
  assigned_ambulance_id UUID,
  assigned_garage_id UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  assigned_by UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE device_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_assignments_select_all" ON device_assignments;
CREATE POLICY "device_assignments_select_all" ON device_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "device_assignments_insert_admin" ON device_assignments;
CREATE POLICY "device_assignments_insert_admin" ON device_assignments FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

DROP POLICY IF EXISTS "device_assignments_update_admin" ON device_assignments;
CREATE POLICY "device_assignments_update_admin" ON device_assignments FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

-- RECORDINGS
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  recording_type TEXT NOT NULL CHECK (recording_type IN (
    'continuous', 'event', 'manual', 'emergency', 'inspection', 'trip'
  )),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  file_path TEXT,
  thumbnail_path TEXT,
  storage_bucket TEXT DEFAULT 'recordings',
  latitude NUMERIC,
  longitude NUMERIC,
  speed_kmh NUMERIC,
  odometer_km NUMERIC,
  timezone TEXT DEFAULT 'Africa/Nairobi',
  trip_id UUID,
  boda_trip_id UUID REFERENCES boda_trips(id) ON DELETE SET NULL,
  mtaxi_trip_id UUID REFERENCES mtaxi_trips(id) ON DELETE SET NULL,
  freight_request_id UUID REFERENCES freight_requests(id) ON DELETE SET NULL,
  triggered_by TEXT CHECK (triggered_by IN ('manual', 'g_force', 'speed', 'panic', 'sos', 'collision', 'schedule', 'voice_command')),
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recordings_select_participants" ON recordings;
CREATE POLICY "recordings_select_participants" ON recordings FOR SELECT USING (
  auth.uid() IN (SELECT requester_id FROM boda_trips WHERE id = recordings.boda_trip_id)
  OR auth.uid() IN (SELECT requester_id FROM mtaxi_trips WHERE id = recordings.mtaxi_trip_id)
  OR auth.uid() IN (SELECT requester_id FROM freight_requests WHERE id = recordings.freight_request_id)
  OR auth.uid() IN (SELECT assigned_user_id FROM device_assignments WHERE device_id = recordings.device_id)
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'police_officer', 'mechanic'))
);

DROP POLICY IF EXISTS "recordings_insert_driver" ON recordings;
CREATE POLICY "recordings_insert_driver" ON recordings FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT assigned_user_id FROM device_assignments WHERE device_id = recordings.device_id)
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
);

DROP POLICY IF EXISTS "recordings_update_driver" ON recordings;
CREATE POLICY "recordings_update_driver" ON recordings FOR UPDATE USING (
  auth.uid() IN (SELECT assigned_user_id FROM device_assignments WHERE device_id = recordings.device_id)
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
);

-- EVIDENCE
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'crash', 'emergency_brake', 'rollover', 'airbag', 'sos', 'panic_button',
    'hijack', 'forced_entry', 'overspeed', 'harsh_acceleration', 'harsh_cornering',
    'harsh_braking', 'driver_fatigue', 'medical_emergency', 'bodycam_emergency',
    'inspection_complete', 'collision', 'near_miss', 'theft'
  )),
  title TEXT NOT NULL,
  description TEXT,
  start_timestamp TIMESTAMPTZ,
  end_timestamp TIMESTAMPTZ,
  latitude NUMERIC,
  longitude NUMERIC,
  speed_at_event NUMERIC,
  g_force NUMERIC,
  is_locked BOOLEAN DEFAULT false,
  locked_by UUID,
  locked_at TIMESTAMPTZ,
  chain_of_custody JSONB DEFAULT '[]',
  share_token TEXT UNIQUE,
  download_count INTEGER DEFAULT 0,
  case_number TEXT,
  police_reference TEXT,
  court_case_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evidence_select_authorized" ON evidence;
CREATE POLICY "evidence_select_authorized" ON evidence FOR SELECT USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'police_officer', 'fleet_manager', 'mechanic', 'insurance_agent'))
  OR auth.uid() = evidence.locked_by
  OR evidence.share_token IS NOT NULL
);

DROP POLICY IF EXISTS "evidence_insert_driver" ON evidence;
CREATE POLICY "evidence_insert_driver" ON evidence FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT assigned_user_id FROM device_assignments WHERE device_id IN (
    SELECT device_id FROM recordings WHERE id = evidence.recording_id
  ))
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'police_officer'))
);

DROP POLICY IF EXISTS "evidence_update_authorized" ON evidence;
CREATE POLICY "evidence_update_authorized" ON evidence FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'police_officer', 'fleet_manager'))
  OR (NOT evidence.is_locked AND auth.uid() IN (SELECT assigned_user_id FROM device_assignments WHERE device_id IN (
    SELECT device_id FROM recordings WHERE id = evidence.recording_id
  )))
);

-- INCIDENTS
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'crash', 'emergency_brake', 'rollover', 'airbag_deployment', 'sos',
    'panic_button', 'hijack', 'forced_entry', 'overspeed', 'harsh_acceleration',
    'harsh_cornering', 'harsh_braking', 'driver_fatigue', 'medical_emergency',
    'bodycam_emergency', 'collision', 'near_miss', 'theft', 'fire',
    'medical_transport', 'vehicle_breakdown', 'cargo_damage'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed', 'false_positive')),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  recording_id UUID REFERENCES recordings(id) ON DELETE SET NULL,
  evidence_id UUID REFERENCES evidence(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  driver_id UUID,
  latitude NUMERIC,
  longitude NUMERIC,
  address TEXT,
  description TEXT,
  injuries_reported BOOLEAN DEFAULT false,
  emergency_services_notified BOOLEAN DEFAULT false,
  emergency_services_arrived_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "incidents_select_participants" ON incidents;
CREATE POLICY "incidents_select_participants" ON incidents FOR SELECT USING (
  auth.uid() = incidents.driver_id
  OR auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'police_officer', 'mechanic', 'insurance_agent', 'ambulance_dispatcher'))
);

DROP POLICY IF EXISTS "incidents_insert_anyone" ON incidents;
CREATE POLICY "incidents_insert_anyone" ON incidents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "incidents_update_authorized" ON incidents;
CREATE POLICY "incidents_update_authorized" ON incidents FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'police_officer', 'mechanic', 'ambulance_dispatcher'))
  OR auth.uid() = incidents.driver_id
);

-- REALTIME
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE devices;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'devices already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE device_assignments;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'device_assignments already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE recordings;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'recordings already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE evidence;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'evidence already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'incidents already in publication';
END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_devices_connection ON devices(connection_type);
CREATE INDEX IF NOT EXISTS idx_device_assignments_device ON device_assignments(device_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_user ON device_assignments(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_vehicle ON device_assignments(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_recordings_device ON recordings(device_id);
CREATE INDEX IF NOT EXISTS idx_recordings_type ON recordings(recording_type);
CREATE INDEX IF NOT EXISTS idx_recordings_time ON recordings(start_time);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_locked ON evidence(is_locked);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);

COMMIT;
