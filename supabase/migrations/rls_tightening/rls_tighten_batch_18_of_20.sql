-- ============================================
-- RLS TIGHTENING BATCH 18/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_bank_reconciliations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_bank_reconciliations" ON public.treasury_bank_reconciliations;
    CREATE POLICY "treasury-bank-reconciliations_select-tight" ON public.treasury_bank_reconciliations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_budget_allocations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_budget_allocations" ON public.treasury_budget_allocations;
    CREATE POLICY "treasury-budget-allocations_select-tight" ON public.treasury_budget_allocations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_budget_cycles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_budget_cycles" ON public.treasury_budget_cycles;
    CREATE POLICY "treasury-budget-cycles_select-tight" ON public.treasury_budget_cycles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_budgets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_budgets" ON public.treasury_budgets;
    CREATE POLICY "treasury-budgets_select-tight" ON public.treasury_budgets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_cash_forecasts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_cash_forecasts" ON public.treasury_cash_forecasts;
    CREATE POLICY "treasury-cash-forecasts_select-tight" ON public.treasury_cash_forecasts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_cashflow' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "treasury_cashflow_isolation" ON public.treasury_cashflow;
    CREATE POLICY "treasury-cashflow_all-tight" ON public.treasury_cashflow
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_cashflow' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_cashflow" ON public.treasury_cashflow;
    CREATE POLICY "treasury-cashflow_select-tight" ON public.treasury_cashflow
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_citizen_feedback' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_citizen_feedback" ON public.treasury_citizen_feedback;
    CREATE POLICY "treasury-citizen-feedback_select-tight" ON public.treasury_citizen_feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_commitments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_commitments" ON public.treasury_commitments;
    CREATE POLICY "treasury-commitments_select-tight" ON public.treasury_commitments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_contingency_draws' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_contingency_draws" ON public.treasury_contingency_draws;
    CREATE POLICY "treasury-contingency-draws_select-tight" ON public.treasury_contingency_draws
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_contracts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_contracts" ON public.treasury_contracts;
    CREATE POLICY "treasury-contracts_select-tight" ON public.treasury_contracts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_debt_instruments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_debt_instruments" ON public.treasury_debt_instruments;
    CREATE POLICY "treasury-debt-instruments_select-tight" ON public.treasury_debt_instruments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_debt_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_debt_payments" ON public.treasury_debt_payments;
    CREATE POLICY "treasury-debt-payments_select-tight" ON public.treasury_debt_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_expenditures' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_expenditures" ON public.treasury_expenditures;
    CREATE POLICY "treasury-expenditures_select-tight" ON public.treasury_expenditures
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_fiscal_reports' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_fiscal_reports" ON public.treasury_fiscal_reports;
    CREATE POLICY "treasury-fiscal-reports_select-tight" ON public.treasury_fiscal_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_intergov_transfers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_intergov_transfers" ON public.treasury_intergov_transfers;
    CREATE POLICY "treasury-intergov-transfers_select-tight" ON public.treasury_intergov_transfers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_payroll_cycles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_payroll_cycles" ON public.treasury_payroll_cycles;
    CREATE POLICY "treasury-payroll-cycles_select-tight" ON public.treasury_payroll_cycles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_payroll_entries' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_payroll_entries" ON public.treasury_payroll_entries;
    CREATE POLICY "treasury-payroll-entries_select-tight" ON public.treasury_payroll_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_procurement_requisitions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_procurement_requisitions" ON public.treasury_procurement_requisitions;
    CREATE POLICY "treasury-procurement-requisitions_select-tight" ON public.treasury_procurement_requisitions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_reports' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_reports" ON public.treasury_reports;
    CREATE POLICY "treasury-reports_select-tight" ON public.treasury_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_revenue' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "treasury_revenue_isolation" ON public.treasury_revenue;
    CREATE POLICY "treasury-revenue_all-tight" ON public.treasury_revenue
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_revenue' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_revenue" ON public.treasury_revenue;
    CREATE POLICY "treasury-revenue_select-tight" ON public.treasury_revenue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_revenue_collections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_revenue_collections" ON public.treasury_revenue_collections;
    CREATE POLICY "treasury-revenue-collections_select-tight" ON public.treasury_revenue_collections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_revenue_forecasts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_revenue_forecasts" ON public.treasury_revenue_forecasts;
    CREATE POLICY "treasury-revenue-forecasts_select-tight" ON public.treasury_revenue_forecasts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_smart_contracts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_smart_contracts" ON public.treasury_smart_contracts;
    CREATE POLICY "treasury-smart-contracts_select-tight" ON public.treasury_smart_contracts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_tenders' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_tenders" ON public.treasury_tenders;
    CREATE POLICY "treasury-tenders_select-tight" ON public.treasury_tenders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_tsa_accounts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_tsa_accounts" ON public.treasury_tsa_accounts;
    CREATE POLICY "treasury-tsa-accounts_select-tight" ON public.treasury_tsa_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_tsa_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_tsa_transactions" ON public.treasury_tsa_transactions;
    CREATE POLICY "treasury-tsa-transactions_select-tight" ON public.treasury_tsa_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_warrants' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_warrants" ON public.treasury_warrants;
    CREATE POLICY "treasury-warrants_select-tight" ON public.treasury_warrants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tribe_comments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tribe_comments" ON public.tribe_comments;
    CREATE POLICY "tribe-comments_select-tight" ON public.tribe_comments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

