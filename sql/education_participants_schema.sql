
-- ============================================================
-- MTAA Education Unified Participants System
-- Safe to re-run. All operations wrapped in existence checks.
-- ============================================================

-- 1) Add is_head_teacher to education_teachers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'education_teachers' AND column_name = 'is_head_teacher') THEN
    ALTER TABLE education_teachers ADD COLUMN is_head_teacher BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2) Add role enum values support to education_staff (if role is text/varchar)
-- No schema change needed — role is already a text field

-- 3) Create education_parents table if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'education_parents') THEN
    CREATE TABLE education_parents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
      institution_id UUID REFERENCES education_institutions(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      relationship TEXT DEFAULT 'parent',
      children_ids UUID[] DEFAULT '{}',
      address TEXT,
      occupation TEXT,
      emergency_contact TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- 4) Create education_accountants table (or extend staff)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'education_accountants') THEN
    CREATE TABLE education_accountants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
      institution_id UUID REFERENCES education_institutions(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      certification TEXT,
      salary DECIMAL(12,2),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- 5) Ensure user_id FK on education_school_admins
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'education_school_admins' AND column_name = 'user_id') THEN
    ALTER TABLE education_school_admins ADD COLUMN user_id UUID;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'education_school_admins_user_id_fkey') THEN
    ALTER TABLE education_school_admins ADD CONSTRAINT education_school_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;

-- 6) Ensure user_id FK on education_staff
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'education_staff' AND column_name = 'user_id') THEN
    ALTER TABLE education_staff ADD COLUMN user_id UUID;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'education_staff_user_id_fkey') THEN
    ALTER TABLE education_staff ADD CONSTRAINT education_staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;

-- 7) Create unified education_participants view
DROP VIEW IF EXISTS education_participants;
CREATE VIEW education_participants AS
SELECT 
  id, user_id, institution_id, full_name, email, phone, is_active, created_at, updated_at,
  'student' AS role, class_id AS detail_1, admission_number AS detail_2, NULL::TEXT AS detail_3
FROM education_students
UNION ALL
SELECT 
  id, user_id, institution_id, full_name, email, phone, is_active, created_at, updated_at,
  CASE WHEN is_head_teacher = true THEN 'head_teacher' ELSE 'teacher' END AS role,
  subject_specialization AS detail_1, qualification AS detail_2, experience_years::TEXT AS detail_3
FROM education_teachers
UNION ALL
SELECT 
  id, user_id, institution_id, full_name, email, phone, is_active, created_at, updated_at,
  COALESCE(role, 'staff') AS role, department AS detail_1, job_title AS detail_2, NULL::TEXT AS detail_3
FROM education_staff
UNION ALL
SELECT 
  id, user_id, institution_id, full_name, email, phone, is_active, created_at, updated_at,
  'admin' AS role, admin_level AS detail_1, permissions AS detail_2, NULL::TEXT AS detail_3
FROM education_school_admins
UNION ALL
SELECT 
  id, user_id, institution_id, full_name, email, phone, is_active, created_at, updated_at,
  'parent' AS role, relationship AS detail_1, array_to_string(children_ids, ',') AS detail_2, occupation AS detail_3
FROM education_parents
UNION ALL
SELECT 
  id, user_id, institution_id, full_name, email, phone, is_active, created_at, updated_at,
  'accountant' AS role, certification AS detail_1, salary::TEXT AS detail_2, NULL::TEXT AS detail_3
FROM education_accountants;

-- 8) Enable RLS on new tables
ALTER TABLE education_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_accountants ENABLE ROW LEVEL SECURITY;

-- 9) Create permissive policies (adjust for production)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'education_parents_all' AND tablename = 'education_parents') THEN
    CREATE POLICY education_parents_all ON education_parents FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'education_accountants_all' AND tablename = 'education_accountants') THEN
    CREATE POLICY education_accountants_all ON education_accountants FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 10) Refresh PostgREST
NOTIFY pgrst, 'reload schema';
