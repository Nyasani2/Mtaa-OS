-- ============================================================
-- MTAA AUTH SECURITY SCHEMA — Idempotent Fix
-- ============================================================

CREATE TABLE IF NOT EXISTS device_trust (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id text NOT NULL,
  device_name text,
  device_type text,
  biometric_enrolled boolean DEFAULT false,
  biometric_type text,
  trusted boolean DEFAULT false,
  enrolled_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

ALTER TABLE device_trust ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "device_trust_select_own" ON device_trust FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'Policy exists';
END $$;

DO $$ BEGIN
  CREATE POLICY "device_trust_insert_own" ON device_trust FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'Policy exists';
END $$;

DO $$ BEGIN
  CREATE POLICY "device_trust_update_own" ON device_trust FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'Policy exists';
END $$;

DO $$ BEGIN
  CREATE POLICY "device_trust_delete_own" ON device_trust FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'Policy exists';
END $$;

CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  device_id text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "security_events_select_own" ON security_events FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'Policy exists';
END $$;

DO $$ BEGIN
  CREATE POLICY "security_events_insert_own" ON security_events FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'Policy exists';
END $$;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_security_event_at timestamptz,
  ADD COLUMN IF NOT EXISTS account_frozen boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS freeze_until timestamptz;

CREATE OR REPLACE FUNCTION public.validate_device_trust(p_user_id uuid, p_device_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM device_trust
    WHERE user_id = p_user_id AND device_id = p_device_id AND trusted = true AND revoked_at IS NULL
  );
END;
$$;

CREATE INDEX IF NOT EXISTS idx_device_trust_user ON device_trust(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, created_at DESC);
