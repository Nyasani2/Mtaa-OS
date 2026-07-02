-- ============================================================
-- MTAA OS V10: Fix user_profiles RLS Policies
-- Run in Supabase Dashboard → SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Check current column type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'user_id';

-- 2. Check existing policies
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr
FROM pg_policy WHERE polrelid = 'user_profiles'::regclass;

-- 3. Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Fix user_id column type if it's text (uncomment only if needed)
-- ALTER TABLE user_profiles ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 5. Drop all old policies (clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can upsert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete access for own profile" ON user_profiles;

-- 6. Create correct policies (works for both uuid and text user_id)
-- Using ::text cast ensures compatibility regardless of column type
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 8. Verify
SELECT 'RLS policies recreated successfully' as status;
SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'user_profiles'::regclass;
