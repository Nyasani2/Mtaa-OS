-- ============================================================
-- MTAA Device Platform — OBD & Fleet Alert Schema
-- Batch 7 Part 2: obd_diagnostics, repair_records, fleet_alerts
-- ============================================================

-- ============================================
-- OBD DIAGNOSTICS
-- ============================================
CREATE TABLE IF NOT EXISTS obd_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  scan_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scanner_device_id UUID REFERENCES devices(id),
  fault_codes JSONB DEFAULT '[]',
  readiness_status JSONB DEFAULT '{}',
  live_data JSONB DEFAULT '{}',
  freeze_frame JSONB,
  mileage_km NUMERIC,
  fuel_level_percent NUMERIC CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
  engine_temp_c NUMERIC,
  battery_voltage NUMERIC,
  mechanic_id UUID REFERENCES auth.users(id),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'requires_attention')),
  estimated_repair_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE obd_diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "obd_select_mechanic" ON obd_diagnostics;
CREATE POLICY "obd_select_mechanic" ON obd_diagnostics FOR SELECT USING (
  auth.uid() = mechanic_id
  OR auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

DROP POLICY IF EXISTS "obd_insert_mechanic" ON obd_diagnostics;
CREATE POLICY "obd_insert_mechanic" ON obd_diagnostics FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'mechanic'))
);

DROP POLICY IF EXISTS "obd_update_mechanic" ON obd_diagnostics;
CREATE POLICY "obd_update_mechanic" ON obd_diagnostics FOR UPDATE USING (
  auth.uid() = mechanic_id
  OR auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'mechanic'))
);

-- ============================================
-- REPAIR RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS repair_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id UUID REFERENCES obd_diagnostics(id),
  vehicle_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  mechanic_id UUID NOT NULL REFERENCES auth.users(id),
  repair_type TEXT NOT NULL,
  description TEXT,
  parts_replaced JSONB DEFAULT '[]',
  labor_hours NUMERIC,
  labor_rate NUMERIC,
  total_cost NUMERIC,
  before_photos TEXT[] DEFAULT '{}',
  after_photos TEXT[] DEFAULT '{}',
  invoice_url TEXT,
  warranty_months INTEGER,
  customer_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'warranty_claim')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE repair_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repair_select_participants" ON repair_records;
CREATE POLICY "repair_select_participants" ON repair_records FOR SELECT USING (
  auth.uid() = mechanic_id
  OR auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
);

DROP POLICY IF EXISTS "repair_insert_mechanic" ON repair_records;
CREATE POLICY "repair_insert_mechanic" ON repair_records FOR INSERT WITH CHECK (
  auth.uid() = mechanic_id
  OR auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'mechanic'))
);

-- ============================================
-- FLEET ALERTS
-- ============================================
CREATE TABLE IF NOT EXISTS fleet_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'camera_disconnected', 'storage_full', 'battery_low', 'recording_stopped',
    'crash_detected', 'evidence_uploaded', 'firmware_available', 'camera_malfunction',
    'device_offline', 'device_error', 'signal_weak', 'health_degraded'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  vehicle_id UUID REFERENCES trucks(id),
  device_id UUID REFERENCES devices(id),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fleet_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fleet_alerts_select_all" ON fleet_alerts;
CREATE POLICY "fleet_alerts_select_all" ON fleet_alerts FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

DROP POLICY IF EXISTS "fleet_alerts_insert_system" ON fleet_alerts;
CREATE POLICY "fleet_alerts_insert_system" ON fleet_alerts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "fleet_alerts_ack_admin" ON fleet_alerts;
CREATE POLICY "fleet_alerts_ack_admin" ON fleet_alerts FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'mechanic'))
);

-- ============================================
-- REALTIME
-- ============================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE obd_diagnostics;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'obd_diagnostics already in publication'; END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE repair_records;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'repair_records already in publication'; END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE fleet_alerts;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'fleet_alerts already in publication'; END $$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_obd_vehicle ON obd_diagnostics(vehicle_id, scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_obd_mechanic ON obd_diagnostics(mechanic_id, status);
CREATE INDEX IF NOT EXISTS idx_repair_vehicle ON repair_records(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_repair_status ON repair_records(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_alerts_vehicle ON fleet_alerts(vehicle_id, acknowledged, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_alerts_severity ON fleet_alerts(severity, acknowledged);
