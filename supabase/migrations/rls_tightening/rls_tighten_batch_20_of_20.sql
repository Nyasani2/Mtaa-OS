-- ============================================
-- RLS TIGHTENING BATCH 20/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_audit_logs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_audit_logs" ON public.wallet_audit_logs;
    CREATE POLICY "wallet-audit-logs_select-tight" ON public.wallet_audit_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_balances' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_balances" ON public.wallet_balances;
    CREATE POLICY "wallet-balances_select-tight" ON public.wallet_balances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_escrows' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_escrows" ON public.wallet_escrows;
    CREATE POLICY "wallet-escrows_select-tight" ON public.wallet_escrows
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_gofund_updates' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_gofund_updates" ON public.wallet_gofund_updates;
    CREATE POLICY "wallet-gofund-updates_select-tight" ON public.wallet_gofund_updates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_ledger' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_ledger" ON public.wallet_ledger;
    CREATE POLICY "wallet-ledger_select-tight" ON public.wallet_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_migrations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_migrations" ON public.wallet_migrations;
    CREATE POLICY "wallet-migrations_select-tight" ON public.wallet_migrations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_profiles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_profiles" ON public.wallet_profiles;
    CREATE POLICY "wallet-profiles_select-tight" ON public.wallet_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_risk_scores' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_risk_scores" ON public.wallet_risk_scores;
    CREATE POLICY "wallet-risk-scores_select-tight" ON public.wallet_risk_scores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_sacco_directory' AND column_name = 'created_by'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_sacco_directory" ON public.wallet_sacco_directory;
    CREATE POLICY "wallet-sacco-directory_select-tight" ON public.wallet_sacco_directory
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_transaction_locks' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own wallet_transaction_locks" ON public.wallet_transaction_locks;
    CREATE POLICY "wallet-transaction-locks_select-tight" ON public.wallet_transaction_locks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_ai_match_events' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_ai_match_events" ON public.work_ai_match_events;
    CREATE POLICY "work-ai-match-events_select-tight" ON public.work_ai_match_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_certifications' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_certifications" ON public.work_certifications;
    CREATE POLICY "work-certifications_select-tight" ON public.work_certifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_cv_structured' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_cv_structured" ON public.work_cv_structured;
    CREATE POLICY "work-cv-structured_select-tight" ON public.work_cv_structured
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_education' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_education" ON public.work_education;
    CREATE POLICY "work-education_select-tight" ON public.work_education
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_experience' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_experience" ON public.work_experience;
    CREATE POLICY "work-experience_select-tight" ON public.work_experience
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_permits' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_permits" ON public.work_permits;
    CREATE POLICY "work-permits_select-tight" ON public.work_permits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_portfolio_assets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_portfolio_assets" ON public.work_portfolio_assets;
    CREATE POLICY "work-portfolio-assets_select-tight" ON public.work_portfolio_assets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_portfolio_projects' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_portfolio_projects" ON public.work_portfolio_projects;
    CREATE POLICY "work-portfolio-projects_select-tight" ON public.work_portfolio_projects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_preferences' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_preferences" ON public.work_preferences;
    CREATE POLICY "work-preferences_select-tight" ON public.work_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_profile_scores' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_profile_scores" ON public.work_profile_scores;
    CREATE POLICY "work-profile-scores_select-tight" ON public.work_profile_scores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_profile_skills' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own work_profile_skills" ON public.work_profile_skills;
    CREATE POLICY "work-profile-skills_select-tight" ON public.work_profile_skills
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'worker_portfolio' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own worker_portfolio" ON public.worker_portfolio;
    CREATE POLICY "worker-portfolio_select-tight" ON public.worker_portfolio
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'worker_reputation' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own worker_reputation" ON public.worker_reputation;
    CREATE POLICY "worker-reputation_select-tight" ON public.worker_reputation
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'worker_skills' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own worker_skills" ON public.worker_skills;
    CREATE POLICY "worker-skills_select-tight" ON public.worker_skills
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'worker_status' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own worker_status" ON public.worker_status;
    CREATE POLICY "worker-status_select-tight" ON public.worker_status
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

