-- MTAA Phase 5: Device Trust & QR Identity
-- Run this in Supabase SQL Editor

-- Device registration table
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  public_key TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  is_current BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  UNIQUE(user_id, device_name, platform)
);

-- RLS: Users can only see their own devices
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON user_devices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own device"
  ON user_devices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own devices"
  ON user_devices FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own devices"
  ON user_devices FOR DELETE
  USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_current ON user_devices(user_id, is_current);

-- QR identity: add qr_identity_url to user_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'qr_identity_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN qr_identity_url TEXT;
  END IF;
END $$;

-- Security audit log for payment auth events
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES user_devices(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login', 'logout', 'pin_created', 'pin_changed', 'pin_cleared',
    'pin_failed', 'pin_lockout', 'biometric_enabled', 'biometric_disabled',
    'biometric_auth_success', 'biometric_auth_failed', 'app_locked',
    'app_unlocked', 'device_registered', 'device_revoked', 'device_trusted',
    'payment_auth_success', 'payment_auth_failed', 'qr_scanned',
    'password_reset', 'email_verified'
  )),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON security_audit_logs(created_at DESC);

-- RLS for audit logs (read-only for users, full access for admin edge functions)
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON security_audit_logs FOR SELECT
  USING (user_id = auth.uid());
