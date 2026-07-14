-- ============================================
-- RLS TIGHTENING BATCH 2/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'avatars' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "avatars_select" ON public.avatars;
    CREATE POLICY "avatars_select-tight" ON public.avatars
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'avatars' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "avatars_update" ON public.avatars;
    CREATE POLICY "avatars_update-tight" ON public.avatars
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bonded_warehouses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "bonded_warehouses_delete" ON public.bonded_warehouses;
    CREATE POLICY "bonded-warehouses_delete-tight" ON public.bonded_warehouses
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bonded_warehouses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "bonded_warehouses_select" ON public.bonded_warehouses;
    CREATE POLICY "bonded-warehouses_select-tight" ON public.bonded_warehouses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bonded_warehouses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "bonded_warehouses_update" ON public.bonded_warehouses;
    CREATE POLICY "bonded-warehouses_update-tight" ON public.bonded_warehouses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'boosted_posts' AND column_name = 'boosted_by'
  ) THEN
    DROP POLICY IF EXISTS "boosted_posts_public_read" ON public.boosted_posts;
    CREATE POLICY "boosted-posts_select-tight" ON public.boosted_posts
  FOR SELECT TO authenticated
  USING (boosted_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'border_crossings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "border_crossings_delete" ON public.border_crossings;
    CREATE POLICY "border-crossings_delete-tight" ON public.border_crossings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'border_crossings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own border_crossings" ON public.border_crossings; DROP POLICY IF EXISTS "border_crossings_select" ON public.border_crossings;
    CREATE POLICY "border-crossings_select-tight" ON public.border_crossings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'border_crossings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "border_crossings_update" ON public.border_crossings;
    CREATE POLICY "border-crossings_update-tight" ON public.border_crossings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_branches' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "business_branches_delete" ON public.business_branches;
    CREATE POLICY "business-branches_delete-tight" ON public.business_branches
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_branches' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "business_branches_select" ON public.business_branches;
    CREATE POLICY "business-branches_select-tight" ON public.business_branches
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_branches' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "business_branches_update" ON public.business_branches;
    CREATE POLICY "business-branches_update-tight" ON public.business_branches
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_documents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own business_documents" ON public.business_documents;
    CREATE POLICY "business-documents_select-tight" ON public.business_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_profiles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own business_profiles" ON public.business_profiles;
    CREATE POLICY "business-profiles_select-tight" ON public.business_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_staff' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own business_staff" ON public.business_staff;
    CREATE POLICY "business-staff_select-tight" ON public.business_staff
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own business_transactions" ON public.business_transactions;
    CREATE POLICY "business-transactions_select-tight" ON public.business_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "businesses_delete" ON public.businesses;
    CREATE POLICY "businesses_delete-tight" ON public.businesses
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "businesses_select" ON public.businesses;
    CREATE POLICY "businesses_select-tight" ON public.businesses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "businesses_update" ON public.businesses;
    CREATE POLICY "businesses_update-tight" ON public.businesses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own campaigns" ON public.campaigns;
    CREATE POLICY "campaigns_select-tight" ON public.campaigns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cargo_manifests' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own cargo_manifests" ON public.cargo_manifests;
    CREATE POLICY "cargo-manifests_select-tight" ON public.cargo_manifests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'case_evidence' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own case_evidence" ON public.case_evidence;
    CREATE POLICY "case-evidence_select-tight" ON public.case_evidence
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'case_history' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own case_history" ON public.case_history;
    CREATE POLICY "case-history_select-tight" ON public.case_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'case_timeline' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own case_timeline" ON public.case_timeline;
    CREATE POLICY "case-timeline_select-tight" ON public.case_timeline
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'case_updates' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own case_updates" ON public.case_updates;
    CREATE POLICY "case-updates_select-tight" ON public.case_updates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_point_transaction_events' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own cash_point_transaction_events" ON public.cash_point_transaction_events;
    CREATE POLICY "cash-point-transaction-events_select-tight" ON public.cash_point_transaction_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_point_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own cash_point_transactions" ON public.cash_point_transactions;
    CREATE POLICY "cash-point-transactions_select-tight" ON public.cash_point_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_points' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own cash_points" ON public.cash_points;
    CREATE POLICY "cash-points_select-tight" ON public.cash_points
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cashpoint_agents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own cashpoint_agents" ON public.cashpoint_agents;
    CREATE POLICY "cashpoint-agents_select-tight" ON public.cashpoint_agents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cashpoint_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own cashpoint_transactions" ON public.cashpoint_transactions;
    CREATE POLICY "cashpoint-transactions_select-tight" ON public.cashpoint_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

