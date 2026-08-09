-- ============================================================
-- MTAA EDUCATION SCHEMA FIXES
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. CREATE VIEW: education_schools -> education_institutions
--    This fixes all frontend queries referencing education_schools
-- ============================================================
DROP VIEW IF EXISTS education_schools;
CREATE OR REPLACE VIEW education_schools AS
SELECT 
  id,
  name,
  slug,
  type,
  country,
  region,
  city,
  address,
  phone,
  email,
  website,
  logo_url,
  cover_image_url,
  description,
  founded_year,
  accreditation,
  curriculum_type,
  language_of_instruction,
  student_capacity,
  staff_count,
  status,
  is_verified,
  verification_date,
  owner_id,
  parent_id,
  metadata,
  settings,
  created_at,
  updated_at
FROM education_institutions;

-- Comment so PostgREST picks it up
COMMENT ON VIEW education_schools IS 'Alias view for frontend compatibility';

-- ============================================================
-- 2. ADD MISSING user_id COLUMNS (if they don't exist)
-- ============================================================

-- education_teachers.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'education_teachers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE education_teachers ADD COLUMN user_id UUID;
    CREATE INDEX idx_education_teachers_user_id ON education_teachers(user_id);
  END IF;
END $$;

-- education_students.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'education_students' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE education_students ADD COLUMN user_id UUID;
    CREATE INDEX idx_education_students_user_id ON education_students(user_id);
  END IF;
END $$;

-- education_staff.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'education_staff' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE education_staff ADD COLUMN user_id UUID;
    CREATE INDEX idx_education_staff_user_id ON education_staff(user_id);
  END IF;
END $$;

-- education_school_admins.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'education_school_admins' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE education_school_admins ADD COLUMN user_id UUID;
    CREATE INDEX idx_education_school_admins_user_id ON education_school_admins(user_id);
  END IF;
END $$;

-- education_institutions.owner_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'education_institutions' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE education_institutions ADD COLUMN owner_id UUID;
    CREATE INDEX idx_education_institutions_owner_id ON education_institutions(owner_id);
  END IF;
END $$;

-- ============================================================
-- 3. ADD MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================

-- education_teachers.user_id -> user_profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'education_teachers_user_id_fkey'
  ) THEN
    ALTER TABLE education_teachers 
      ADD CONSTRAINT education_teachers_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- education_students.user_id -> user_profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'education_students_user_id_fkey'
  ) THEN
    ALTER TABLE education_students 
      ADD CONSTRAINT education_students_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- education_staff.user_id -> user_profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'education_staff_user_id_fkey'
  ) THEN
    ALTER TABLE education_staff 
      ADD CONSTRAINT education_staff_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- education_school_admins.user_id -> user_profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'education_school_admins_user_id_fkey'
  ) THEN
    ALTER TABLE education_school_admins 
      ADD CONSTRAINT education_school_admins_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- education_institutions.owner_id -> user_profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'education_institutions_owner_id_fkey'
  ) THEN
    ALTER TABLE education_institutions 
      ADD CONSTRAINT education_institutions_owner_id_fkey 
      FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 4. ADD MISSING RELATIONSHIPS FOR COMMON JOINS
-- ============================================================

-- education_classes -> education_institutions (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'education_classes' AND column_name = 'institution_id'
  ) THEN
    ALTER TABLE education_classes ADD COLUMN institution_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'education_classes_institution_id_fkey'
  ) THEN
    ALTER TABLE education_classes 
      ADD CONSTRAINT education_classes_institution_id_fkey 
      FOREIGN KEY (institution_id) REFERENCES education_institutions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- education_subjects -> education_institutions (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'education_subjects' AND column_name = 'institution_id'
  ) THEN
    ALTER TABLE education_subjects ADD COLUMN institution_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'education_subjects_institution_id_fkey'
  ) THEN
    ALTER TABLE education_subjects 
      ADD CONSTRAINT education_subjects_institution_id_fkey 
      FOREIGN KEY (institution_id) REFERENCES education_institutions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- education_teachers -> education_institutions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'education_teachers' AND column_name = 'institution_id'
  ) THEN
    ALTER TABLE education_teachers ADD COLUMN institution_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'education_teachers_institution_id_fkey'
  ) THEN
    ALTER TABLE education_teachers 
      ADD CONSTRAINT education_teachers_institution_id_fkey 
      FOREIGN KEY (institution_id) REFERENCES education_institutions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 5. ENABLE RLS ON VIEW (if needed)
-- ============================================================
-- Views don't have RLS directly, but underlying table does
-- Ensure education_institutions has proper RLS

-- ============================================================
-- 6. REFRESH SCHEMA CACHE
-- ============================================================
-- Supabase/PostgREST will auto-refresh, but you can force with:
-- NOTIFY pgrst, 'reload schema';

SELECT 'Education schema fixes applied successfully' AS status;
