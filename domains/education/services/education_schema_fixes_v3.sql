-- ============================================================
-- MTAA EDUCATION SCHEMA FIXES v3
-- Minimal safe fixes — only adds missing FK constraints
-- References user_profiles(user_id) NOT user_profiles(id)
-- ============================================================

-- 1. CREATE VIEW: education_schools -> education_institutions
DROP VIEW IF EXISTS education_schools;
CREATE OR REPLACE VIEW education_schools AS
SELECT * FROM education_institutions;

COMMENT ON VIEW education_schools IS 'Alias view for frontend compatibility';

-- 2. ADD FK: education_teachers.user_id -> user_profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' AND constraint_name = 'education_teachers_user_id_fkey'
  ) THEN
    ALTER TABLE education_teachers 
      ADD CONSTRAINT education_teachers_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'education_teachers_user_id_fkey skipped: %', SQLERRM;
END $$;

-- 3. ADD FK: education_students.user_id -> user_profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' AND constraint_name = 'education_students_user_id_fkey'
  ) THEN
    ALTER TABLE education_students 
      ADD CONSTRAINT education_students_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'education_students_user_id_fkey skipped: %', SQLERRM;
END $$;

-- 4. ADD FK: education_staff.user_id -> user_profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' AND constraint_name = 'education_staff_user_id_fkey'
  ) THEN
    ALTER TABLE education_staff 
      ADD CONSTRAINT education_staff_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'education_staff_user_id_fkey skipped: %', SQLERRM;
END $$;

-- 5. ADD FK: education_institutions.parent_id -> education_institutions.id (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' AND constraint_name = 'education_institutions_parent_id_fkey'
  ) THEN
    ALTER TABLE education_institutions 
      ADD CONSTRAINT education_institutions_parent_id_fkey 
      FOREIGN KEY (parent_id) REFERENCES education_institutions(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'education_institutions_parent_id_fkey skipped: %', SQLERRM;
END $$;

-- 6. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

SELECT 'Education schema fixes v3 applied successfully' AS status;
