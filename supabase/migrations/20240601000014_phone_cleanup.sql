-- ============================================
-- CLEANUP: Drop all phone module objects safely
-- Run FIRST in Supabase SQL Editor
-- ============================================

-- Drop triggers first (they reference tables)
DROP TRIGGER IF EXISTS update_call_logs_updated_at ON call_logs;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;

-- Drop indexes
DROP INDEX IF EXISTS idx_call_logs_user_id;
DROP INDEX IF EXISTS idx_call_logs_created_at;
DROP INDEX IF EXISTS idx_contacts_user_id;
DROP INDEX IF EXISTS idx_contacts_name;

-- Drop tables with CASCADE (drops dependent objects too)
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;

-- Drop policies (they get dropped with CASCADE on table, but just in case)
DROP POLICY IF EXISTS "call_logs_select_own" ON call_logs;
DROP POLICY IF EXISTS "call_logs_insert_own" ON call_logs;
DROP POLICY IF EXISTS "call_logs_update_own" ON call_logs;
DROP POLICY IF EXISTS "call_logs_delete_own" ON call_logs;
DROP POLICY IF EXISTS "contacts_select_own" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_own" ON contacts;
DROP POLICY IF EXISTS "contacts_update_own" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_own" ON contacts;
