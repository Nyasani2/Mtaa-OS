-- Fix: education_parent_connections already exists (correct table name)
-- education_student_parents was the wrong name used in code

-- Verify the table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'education_parent_connections';

-- If education_student_parents was created by mistake, drop it
DROP TABLE IF EXISTS education_student_parents;

-- Ensure RLS is enabled on education_parent_connections
ALTER TABLE education_parent_connections ENABLE ROW LEVEL SECURITY;

-- Add RLS policies if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'education_parent_connections' AND policyname = 'Parents can view their connections'
  ) THEN
    CREATE POLICY "Parents can view their connections" ON education_parent_connections
      FOR SELECT USING (parent_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'education_parent_connections' AND policyname = 'Admins manage connections'
  ) THEN
    CREATE POLICY "Admins manage connections" ON education_parent_connections
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;
