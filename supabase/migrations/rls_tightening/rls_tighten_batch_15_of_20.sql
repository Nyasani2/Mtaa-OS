-- ============================================
-- RLS TIGHTENING BATCH 15/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_debts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_debts;
    CREATE POLICY "revenue-debts_all-tight" ON public.revenue_debts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_debts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_debts;
    CREATE POLICY "revenue-debts_select-tight" ON public.revenue_debts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_invoices' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_invoices;
    CREATE POLICY "revenue-invoices_all-tight" ON public.revenue_invoices
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_invoices' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_invoices;
    CREATE POLICY "revenue-invoices_select-tight" ON public.revenue_invoices
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_licenses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_licenses;
    CREATE POLICY "revenue-licenses_all-tight" ON public.revenue_licenses
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_licenses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_licenses;
    CREATE POLICY "revenue-licenses_select-tight" ON public.revenue_licenses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_objections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_objections;
    CREATE POLICY "revenue-objections_all-tight" ON public.revenue_objections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_objections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_objections;
    CREATE POLICY "revenue-objections_select-tight" ON public.revenue_objections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_payments;
    CREATE POLICY "revenue-payments_all-tight" ON public.revenue_payments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_payments;
    CREATE POLICY "revenue-payments_select-tight" ON public.revenue_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_payroll' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_payroll;
    CREATE POLICY "revenue-payroll_all-tight" ON public.revenue_payroll
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_payroll' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_payroll;
    CREATE POLICY "revenue-payroll_select-tight" ON public.revenue_payroll
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_procurement' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_procurement;
    CREATE POLICY "revenue-procurement_all-tight" ON public.revenue_procurement
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_procurement' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_procurement;
    CREATE POLICY "revenue-procurement_select-tight" ON public.revenue_procurement
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_refunds' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_refunds;
    CREATE POLICY "revenue-refunds_all-tight" ON public.revenue_refunds
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_refunds' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_refunds;
    CREATE POLICY "revenue-refunds_select-tight" ON public.revenue_refunds
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_returns' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_returns;
    CREATE POLICY "revenue-returns_all-tight" ON public.revenue_returns
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_returns' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_returns;
    CREATE POLICY "revenue-returns_select-tight" ON public.revenue_returns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_staff_attendance' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_staff_attendance;
    CREATE POLICY "revenue-staff-attendance_all-tight" ON public.revenue_staff_attendance
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_staff_attendance' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_staff_attendance;
    CREATE POLICY "revenue-staff-attendance_select-tight" ON public.revenue_staff_attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_tax_obligations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_tax_obligations;
    CREATE POLICY "revenue-tax-obligations_all-tight" ON public.revenue_tax_obligations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_tax_obligations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_tax_obligations;
    CREATE POLICY "revenue-tax-obligations_select-tight" ON public.revenue_tax_obligations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_taxpayers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_taxpayers;
    CREATE POLICY "revenue-taxpayers_all-tight" ON public.revenue_taxpayers
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_taxpayers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own revenue_taxpayers" ON public.revenue_taxpayers; DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_taxpayers;
    CREATE POLICY "revenue-taxpayers_select-tight" ON public.revenue_taxpayers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reward_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own reward_transactions" ON public.reward_transactions;
    CREATE POLICY "reward-transactions_select-tight" ON public.reward_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ride_ratings' AND column_name = 'rater_id'
  ) THEN
    DROP POLICY IF EXISTS "ride_ratings_view" ON public.ride_ratings;
    CREATE POLICY "ride-ratings_select-tight" ON public.ride_ratings
  FOR SELECT TO authenticated
  USING (rater_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'risk_scores' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own risk_scores" ON public.risk_scores;
    CREATE POLICY "risk-scores_select-tight" ON public.risk_scores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sanctions_checks' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own sanctions_checks" ON public.sanctions_checks;
    CREATE POLICY "sanctions-checks_select-tight" ON public.sanctions_checks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sanctions_list' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own sanctions_list" ON public.sanctions_list;
    CREATE POLICY "sanctions-list_select-tight" ON public.sanctions_list
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saves' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own saves" ON public.saves;
    CREATE POLICY "saves_select-tight" ON public.saves
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

