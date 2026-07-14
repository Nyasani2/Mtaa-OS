-- ============================================
-- RLS TIGHTENING BATCH 3/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "certificates_delete" ON public.certificates;
    CREATE POLICY "certificates_delete-tight" ON public.certificates
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "certificates_select" ON public.certificates;
    CREATE POLICY "certificates_select-tight" ON public.certificates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "certificates_update" ON public.certificates;
    CREATE POLICY "certificates_update-tight" ON public.certificates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'child_profiles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own child_profiles" ON public.child_profiles;
    CREATE POLICY "child-profiles_select-tight" ON public.child_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'child_recovery_workflows' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own child_recovery_workflows" ON public.child_recovery_workflows;
    CREATE POLICY "child-recovery-workflows_select-tight" ON public.child_recovery_workflows
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_applications' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own civic_applications" ON public.civic_applications;
    CREATE POLICY "civic-applications_select-tight" ON public.civic_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_court_dockets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_court_dockets_delete" ON public.civic_court_dockets;
    CREATE POLICY "civic-court-dockets_delete-tight" ON public.civic_court_dockets
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_court_dockets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_court_dockets_select" ON public.civic_court_dockets;
    CREATE POLICY "civic-court-dockets_select-tight" ON public.civic_court_dockets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_court_dockets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_court_dockets_update" ON public.civic_court_dockets;
    CREATE POLICY "civic-court-dockets_update-tight" ON public.civic_court_dockets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_courts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_courts_delete" ON public.civic_courts;
    CREATE POLICY "civic-courts_delete-tight" ON public.civic_courts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_courts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_courts_select" ON public.civic_courts;
    CREATE POLICY "civic-courts_select-tight" ON public.civic_courts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_courts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_courts_update" ON public.civic_courts;
    CREATE POLICY "civic-courts_update-tight" ON public.civic_courts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_dashboard_stats' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own civic_dashboard_stats" ON public.civic_dashboard_stats;
    CREATE POLICY "civic-dashboard-stats_select-tight" ON public.civic_dashboard_stats
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_expenditures' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own civic_expenditures" ON public.civic_expenditures;
    CREATE POLICY "civic-expenditures_select-tight" ON public.civic_expenditures
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_personnel' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own civic_personnel" ON public.civic_personnel;
    CREATE POLICY "civic-personnel_select-tight" ON public.civic_personnel
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_prisoners' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own civic_prisoners" ON public.civic_prisoners;
    CREATE POLICY "civic-prisoners_select-tight" ON public.civic_prisoners
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_revenue_consolidations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own civic_revenue_consolidations" ON public.civic_revenue_consolidations;
    CREATE POLICY "civic-revenue-consolidations_select-tight" ON public.civic_revenue_consolidations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_staff' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own civic_staff" ON public.civic_staff;
    CREATE POLICY "civic-staff_select-tight" ON public.civic_staff
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_tax_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_tax_payments_delete" ON public.civic_tax_payments;
    CREATE POLICY "civic-tax-payments_delete-tight" ON public.civic_tax_payments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_tax_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_tax_payments_select" ON public.civic_tax_payments;
    CREATE POLICY "civic-tax-payments_select-tight" ON public.civic_tax_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_tax_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_tax_payments_update" ON public.civic_tax_payments;
    CREATE POLICY "civic-tax-payments_update-tight" ON public.civic_tax_payments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_vouchers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_vouchers_delete" ON public.civic_vouchers;
    CREATE POLICY "civic-vouchers_delete-tight" ON public.civic_vouchers
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_vouchers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_vouchers_select" ON public.civic_vouchers;
    CREATE POLICY "civic-vouchers_select-tight" ON public.civic_vouchers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'civic_vouchers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "civic_vouchers_update" ON public.civic_vouchers;
    CREATE POLICY "civic-vouchers_update-tight" ON public.civic_vouchers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'company_equity' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own company_equity" ON public.company_equity;
    CREATE POLICY "company-equity_select-tight" ON public.company_equity
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_requests' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own contact_requests" ON public.contact_requests;
    CREATE POLICY "contact-requests_select-tight" ON public.contact_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'containers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "containers_delete" ON public.containers;
    CREATE POLICY "containers_delete-tight" ON public.containers
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'containers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "containers_select" ON public.containers;
    CREATE POLICY "containers_select-tight" ON public.containers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'containers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "containers_update" ON public.containers;
    CREATE POLICY "containers_update-tight" ON public.containers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_ads' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own content_ads" ON public.content_ads;
    CREATE POLICY "content-ads_select-tight" ON public.content_ads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

