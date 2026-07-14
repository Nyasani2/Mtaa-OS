-- ============================================
-- RLS TIGHTENING BATCH 7/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_teacher_dashboards' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_teacher_dashboards_delete" ON public.education_teacher_dashboards;
    CREATE POLICY "education-teacher-dashboards_delete-tight" ON public.education_teacher_dashboards
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_teacher_dashboards' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_teacher_dashboards_select" ON public.education_teacher_dashboards;
    CREATE POLICY "education-teacher-dashboards_select-tight" ON public.education_teacher_dashboards
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_teacher_dashboards' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_teacher_dashboards_update" ON public.education_teacher_dashboards;
    CREATE POLICY "education-teacher-dashboards_update-tight" ON public.education_teacher_dashboards
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_test_answers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_test_answers_delete" ON public.education_test_answers;
    CREATE POLICY "education-test-answers_delete-tight" ON public.education_test_answers
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_test_answers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_test_answers_select" ON public.education_test_answers;
    CREATE POLICY "education-test-answers_select-tight" ON public.education_test_answers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_test_answers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_test_answers_update" ON public.education_test_answers;
    CREATE POLICY "education-test-answers_update-tight" ON public.education_test_answers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_test_attempts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_test_attempts_delete" ON public.education_test_attempts;
    CREATE POLICY "education-test-attempts_delete-tight" ON public.education_test_attempts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_test_attempts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_test_attempts_select" ON public.education_test_attempts;
    CREATE POLICY "education-test-attempts_select-tight" ON public.education_test_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_test_attempts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_test_attempts_update" ON public.education_test_attempts;
    CREATE POLICY "education-test-attempts_update-tight" ON public.education_test_attempts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_test_questions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_test_questions_delete" ON public.education_test_questions;
    CREATE POLICY "education-test-questions_delete-tight" ON public.education_test_questions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_test_questions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_test_questions_select" ON public.education_test_questions;
    CREATE POLICY "education-test-questions_select-tight" ON public.education_test_questions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_test_questions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_test_questions_update" ON public.education_test_questions;
    CREATE POLICY "education-test-questions_update-tight" ON public.education_test_questions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_tests' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_tests_delete" ON public.education_tests;
    CREATE POLICY "education-tests_delete-tight" ON public.education_tests
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_tests' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_tests_select" ON public.education_tests;
    CREATE POLICY "education-tests_select-tight" ON public.education_tests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_tests' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_tests_update" ON public.education_tests;
    CREATE POLICY "education-tests_update-tight" ON public.education_tests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_timetable' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_timetable_delete" ON public.education_timetable;
    CREATE POLICY "education-timetable_delete-tight" ON public.education_timetable
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_timetable' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_timetable_select" ON public.education_timetable;
    CREATE POLICY "education-timetable_select-tight" ON public.education_timetable
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_timetable' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_timetable_update" ON public.education_timetable;
    CREATE POLICY "education-timetable_update-tight" ON public.education_timetable
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_walking_checkpoints' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_walking_checkpoints" ON public.education_walking_checkpoints;
    CREATE POLICY "education-walking-checkpoints_select-tight" ON public.education_walking_checkpoints
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_walking_members' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_walking_members" ON public.education_walking_members;
    CREATE POLICY "education-walking-members_select-tight" ON public.education_walking_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'elections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "elections_delete" ON public.elections;
    CREATE POLICY "elections_delete-tight" ON public.elections
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'elections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own elections" ON public.elections; DROP POLICY IF EXISTS "elections_select" ON public.elections;
    CREATE POLICY "elections_select-tight" ON public.elections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'elections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "elections_update" ON public.elections;
    CREATE POLICY "elections_update-tight" ON public.elections
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own escrow" ON public.escrow;
    CREATE POLICY "escrow_select-tight" ON public.escrow
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_milestones' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own escrow_milestones" ON public.escrow_milestones;
    CREATE POLICY "escrow-milestones_select-tight" ON public.escrow_milestones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own escrow_transactions" ON public.escrow_transactions;
    CREATE POLICY "escrow-transactions_select-tight" ON public.escrow_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'evidence_custody' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own evidence_custody" ON public.evidence_custody;
    CREATE POLICY "evidence-custody_select-tight" ON public.evidence_custody
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'excise_licenses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own excise_licenses" ON public.excise_licenses;
    CREATE POLICY "excise-licenses_select-tight" ON public.excise_licenses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_credit_history' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own external_credit_history" ON public.external_credit_history;
    CREATE POLICY "external-credit-history_select-tight" ON public.external_credit_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'facilities' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "facilities_delete" ON public.facilities;
    CREATE POLICY "facilities_delete-tight" ON public.facilities
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

