-- ============================================
-- RLS TIGHTENING BATCH 6/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_groups' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_groups" ON public.education_groups;
    CREATE POLICY "education-groups_select-tight" ON public.education_groups
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_history' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_history" ON public.education_history;
    CREATE POLICY "education-history_select-tight" ON public.education_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_institution_documents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_institution_documents_delete" ON public.education_institution_documents;
    CREATE POLICY "education-institution-documents_delete-tight" ON public.education_institution_documents
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_institution_documents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_institution_documents_select" ON public.education_institution_documents;
    CREATE POLICY "education-institution-documents_select-tight" ON public.education_institution_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_institution_documents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_institution_documents_update" ON public.education_institution_documents;
    CREATE POLICY "education-institution-documents_update-tight" ON public.education_institution_documents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_institution_profiles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_institution_profiles_delete" ON public.education_institution_profiles;
    CREATE POLICY "education-institution-profiles_delete-tight" ON public.education_institution_profiles
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_institution_profiles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_institution_profiles_select" ON public.education_institution_profiles;
    CREATE POLICY "education-institution-profiles_select-tight" ON public.education_institution_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_institution_profiles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_institution_profiles_update" ON public.education_institution_profiles;
    CREATE POLICY "education-institution-profiles_update-tight" ON public.education_institution_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_parent_feedback' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_parent_feedback_delete" ON public.education_parent_feedback;
    CREATE POLICY "education-parent-feedback_delete-tight" ON public.education_parent_feedback
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_parent_feedback' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_parent_feedback_select" ON public.education_parent_feedback;
    CREATE POLICY "education-parent-feedback_select-tight" ON public.education_parent_feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_parent_feedback' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_parent_feedback_update" ON public.education_parent_feedback;
    CREATE POLICY "education-parent-feedback_update-tight" ON public.education_parent_feedback
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_qr_scans' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_qr_scans_delete" ON public.education_qr_scans;
    CREATE POLICY "education-qr-scans_delete-tight" ON public.education_qr_scans
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_qr_scans' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_qr_scans_select" ON public.education_qr_scans;
    CREATE POLICY "education-qr-scans_select-tight" ON public.education_qr_scans
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_qr_scans' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_qr_scans_update" ON public.education_qr_scans;
    CREATE POLICY "education-qr-scans_update-tight" ON public.education_qr_scans
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_resource_access_logs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_resource_access_logs_delete" ON public.education_resource_access_logs;
    CREATE POLICY "education-resource-access-logs_delete-tight" ON public.education_resource_access_logs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_resource_access_logs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_resource_access_logs" ON public.education_resource_access_logs; DROP POLICY IF EXISTS "education_resource_access_logs_select" ON public.education_resource_access_logs;
    CREATE POLICY "education-resource-access-logs_select-tight" ON public.education_resource_access_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_resource_access_logs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_resource_access_logs_update" ON public.education_resource_access_logs;
    CREATE POLICY "education-resource-access-logs_update-tight" ON public.education_resource_access_logs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_resource_collections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_resource_collections_delete" ON public.education_resource_collections;
    CREATE POLICY "education-resource-collections_delete-tight" ON public.education_resource_collections
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_resource_collections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_resource_collections_select" ON public.education_resource_collections;
    CREATE POLICY "education-resource-collections_select-tight" ON public.education_resource_collections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_resource_collections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_resource_collections_update" ON public.education_resource_collections;
    CREATE POLICY "education-resource-collections_update-tight" ON public.education_resource_collections
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_resources' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_resources_delete" ON public.education_resources;
    CREATE POLICY "education-resources_delete-tight" ON public.education_resources
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_resources' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_resources_select" ON public.education_resources;
    CREATE POLICY "education-resources_select-tight" ON public.education_resources
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_resources' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_resources_update" ON public.education_resources;
    CREATE POLICY "education-resources_update-tight" ON public.education_resources
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_school_admins' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_school_admins_delete" ON public.education_school_admins;
    CREATE POLICY "education-school-admins_delete-tight" ON public.education_school_admins
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_school_admins' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_school_admins_select" ON public.education_school_admins;
    CREATE POLICY "education-school-admins_select-tight" ON public.education_school_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_school_admins' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_school_admins_update" ON public.education_school_admins;
    CREATE POLICY "education-school-admins_update-tight" ON public.education_school_admins
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_student_transport' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_student_transport" ON public.education_student_transport;
    CREATE POLICY "education-student-transport_select-tight" ON public.education_student_transport
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_subjects' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_subjects" ON public.education_subjects;
    CREATE POLICY "education-subjects_select-tight" ON public.education_subjects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_submissions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_submissions" ON public.education_submissions;
    CREATE POLICY "education-submissions_select-tight" ON public.education_submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_teacher_bookings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_teacher_bookings" ON public.education_teacher_bookings;
    CREATE POLICY "education-teacher-bookings_select-tight" ON public.education_teacher_bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

