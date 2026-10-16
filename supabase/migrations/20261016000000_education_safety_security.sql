-- ============================================================
-- MTAA Education Safety & Security Module
-- Emergency Response, Biometric Checkpoints, ASIS Integration
-- ============================================================

-- 1. Emergency Alerts Table
CREATE TABLE IF NOT EXISTS education_emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fire', 'security', 'medical', 'natural_disaster', 'terrorist', 'general')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  asis_guidance TEXT,
  evacuation_protocol TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_emergency_alerts_institution ON education_emergency_alerts(institution_id);
CREATE INDEX idx_emergency_alerts_status ON education_emergency_alerts(status);

-- 2. Biometric Checkpoints Table (Gates, Buses, Classrooms)
CREATE TABLE IF NOT EXISTS education_biometric_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gate', 'bus', 'classroom', 'dormitory')),
  location TEXT NOT NULL,
  device_type TEXT DEFAULT 'multi' CHECK (device_type IN ('fingerprint', 'face', 'qr', 'multi')),
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'alert')),
  last_scan TIMESTAMPTZ,
  scans_today INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_biometric_checkpoints_institution ON education_biometric_checkpoints(institution_id);

-- 3. Biometric Scans Log
CREATE TABLE IF NOT EXISTS education_biometric_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id UUID NOT NULL REFERENCES education_biometric_checkpoints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('fingerprint', 'face', 'qr')),
  scan_time TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT false,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_biometric_scans_checkpoint ON education_biometric_scans(checkpoint_id);
CREATE INDEX idx_biometric_scans_user ON education_biometric_scans(user_id);

-- 4. ASIS Threat Alerts Table
CREATE TABLE IF NOT EXISTS asis_threat_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now(),
  detected_by TEXT DEFAULT 'manual' CHECK (detected_by IN ('asis_ai', 'manual', 'camera', 'sensor')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm')),
  acknowledged_at TIMESTAMPTZ,
  asis_recommendation TEXT,
  response_protocol TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_asis_threats_institution ON asis_threat_alerts(institution_id);

-- 5. Security Cameras Table
CREATE TABLE IF NOT EXISTS education_security_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  camera_type TEXT DEFAULT 'cctv' CHECK (camera_type IN ('cctv', 'ip', 'dome', 'ptz')),
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'alert')),
  stream_url TEXT,
  recording BOOLEAN DEFAULT true,
  motion_detection BOOLEAN DEFAULT true,
  last_motion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_security_cameras_institution ON education_security_cameras(institution_id);

NOTIFY pgrst, 'reload schema';
