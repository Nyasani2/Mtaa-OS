-- MTAA Phone Contacts & Call Logs Schema
-- Run in Supabase Dashboard → SQL Editor

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── user_contacts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  display_name TEXT GENERATED ALWAYS AS (
    COALESCE(NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ' '), first_name)
  ) STORED,
  phone_numbers JSONB DEFAULT '[]'::jsonb,
  emails JSONB DEFAULT '[]'::jsonb,
  company TEXT,
  job_title TEXT,
  photo_url TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  whatsapp_number TEXT,
  telegram_username TEXT,
  website TEXT,
  source TEXT DEFAULT 'manual',
  native_contact_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id ON user_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_favorite ON user_contacts(user_id, is_favorite) WHERE is_favorite = TRUE;

-- ─── call_logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES user_contacts(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  call_type TEXT NOT NULL DEFAULT 'outgoing',
  duration INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(user_id, started_at DESC);

-- ─── RLS ───────────────────────────────────────────────────────────
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS contacts_select_own ON user_contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS contacts_insert_own ON user_contacts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS contacts_update_own ON user_contacts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS contacts_delete_own ON user_contacts FOR DELETE USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS call_logs_select_own ON call_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS call_logs_insert_own ON call_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS call_logs_update_own ON call_logs FOR UPDATE USING (user_id = auth.uid());

-- ─── Realtime ──────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE user_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE call_logs;
