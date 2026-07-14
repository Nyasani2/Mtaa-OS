-- ============================================
-- RLS TIGHTENING BATCH 9/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_admissions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_admissions_update" ON public.health_admissions;
    CREATE POLICY "health-admissions_update-tight" ON public.health_admissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_billing' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_billing_delete" ON public.health_billing;
    CREATE POLICY "health-billing_delete-tight" ON public.health_billing
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_billing' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_billing_select" ON public.health_billing;
    CREATE POLICY "health-billing_select-tight" ON public.health_billing
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_billing' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_billing_update" ON public.health_billing;
    CREATE POLICY "health-billing_update-tight" ON public.health_billing
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_pharmacies' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_pharmacies_delete" ON public.health_pharmacies;
    CREATE POLICY "health-pharmacies_delete-tight" ON public.health_pharmacies
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_pharmacies' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_pharmacies_select" ON public.health_pharmacies;
    CREATE POLICY "health-pharmacies_select-tight" ON public.health_pharmacies
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_pharmacies' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_pharmacies_update" ON public.health_pharmacies;
    CREATE POLICY "health-pharmacies_update-tight" ON public.health_pharmacies
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_pharmacy_suppliers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_pharmacy_suppliers_delete" ON public.health_pharmacy_suppliers;
    CREATE POLICY "health-pharmacy-suppliers_delete-tight" ON public.health_pharmacy_suppliers
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_pharmacy_suppliers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_pharmacy_suppliers_select" ON public.health_pharmacy_suppliers;
    CREATE POLICY "health-pharmacy-suppliers_select-tight" ON public.health_pharmacy_suppliers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_pharmacy_suppliers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_pharmacy_suppliers_update" ON public.health_pharmacy_suppliers;
    CREATE POLICY "health-pharmacy-suppliers_update-tight" ON public.health_pharmacy_suppliers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_symptoms' AND column_name = 'recorded_by'
  ) THEN
    DROP POLICY IF EXISTS "health_symptoms_delete" ON public.health_symptoms;
    CREATE POLICY "health-symptoms_delete-tight" ON public.health_symptoms
  FOR DELETE TO authenticated
  USING (recorded_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_symptoms' AND column_name = 'recorded_by'
  ) THEN
    DROP POLICY IF EXISTS "health_symptoms_select" ON public.health_symptoms;
    CREATE POLICY "health-symptoms_select-tight" ON public.health_symptoms
  FOR SELECT TO authenticated
  USING (recorded_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_symptoms' AND column_name = 'recorded_by'
  ) THEN
    DROP POLICY IF EXISTS "health_symptoms_update" ON public.health_symptoms;
    CREATE POLICY "health-symptoms_update-tight" ON public.health_symptoms
  FOR UPDATE TO authenticated
  USING (recorded_by = auth.uid())
  WITH CHECK (recorded_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_telemedicine_sessions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_telemedicine_delete" ON public.health_telemedicine_sessions; DROP POLICY IF EXISTS "health_telemedicine_sessions_delete" ON public.health_telemedicine_sessions;
    CREATE POLICY "health-telemedicine-sessions_delete-tight" ON public.health_telemedicine_sessions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_telemedicine_sessions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_telemedicine_select" ON public.health_telemedicine_sessions; DROP POLICY IF EXISTS "health_telemedicine_sessions_select" ON public.health_telemedicine_sessions;
    CREATE POLICY "health-telemedicine-sessions_select-tight" ON public.health_telemedicine_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_telemedicine_sessions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_telemedicine_sessions_update" ON public.health_telemedicine_sessions; DROP POLICY IF EXISTS "health_telemedicine_update" ON public.health_telemedicine_sessions;
    CREATE POLICY "health-telemedicine-sessions_update-tight" ON public.health_telemedicine_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hotel_reservations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own hotel_reservations" ON public.hotel_reservations;
    CREATE POLICY "hotel-reservations_select-tight" ON public.hotel_reservations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hotel_rooms' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own hotel_rooms" ON public.hotel_rooms;
    CREATE POLICY "hotel-rooms_select-tight" ON public.hotel_rooms
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'identity_verification' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own identity_verification" ON public.identity_verification;
    CREATE POLICY "identity-verification_select-tight" ON public.identity_verification
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'installed_apps' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own installed_apps" ON public.installed_apps;
    CREATE POLICY "installed-apps_select-tight" ON public.installed_apps
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'interests' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own interests" ON public.interests;
    CREATE POLICY "interests_select-tight" ON public.interests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'investment_pools' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own investment_pools" ON public.investment_pools;
    CREATE POLICY "investment-pools_select-tight" ON public.investment_pools
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'investment_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own investment_transactions" ON public.investment_transactions;
    CREATE POLICY "investment-transactions_select-tight" ON public.investment_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_ai_signals' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own job_ai_signals" ON public.job_ai_signals;
    CREATE POLICY "job-ai-signals_select-tight" ON public.job_ai_signals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_candidates' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own job_candidates" ON public.job_candidates;
    CREATE POLICY "job-candidates_select-tight" ON public.job_candidates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_categories' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own job_categories" ON public.job_categories;
    CREATE POLICY "job-categories_select-tight" ON public.job_categories
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_matches' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own job_matches" ON public.job_matches;
    CREATE POLICY "job-matches_select-tight" ON public.job_matches
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_skills' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own job_skills" ON public.job_skills;
    CREATE POLICY "job-skills_select-tight" ON public.job_skills
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kephis_applications' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own kephis_applications" ON public.kephis_applications;
    CREATE POLICY "kephis-applications_select-tight" ON public.kephis_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kephis_certificates' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own kephis_certificates" ON public.kephis_certificates;
    CREATE POLICY "kephis-certificates_select-tight" ON public.kephis_certificates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

