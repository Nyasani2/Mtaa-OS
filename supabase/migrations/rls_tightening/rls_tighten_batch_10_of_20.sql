-- ============================================
-- RLS TIGHTENING BATCH 10/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kephis_inspections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own kephis_inspections" ON public.kephis_inspections;
    CREATE POLICY "kephis-inspections_select-tight" ON public.kephis_inspections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kephis_seed_licenses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own kephis_seed_licenses" ON public.kephis_seed_licenses;
    CREATE POLICY "kephis-seed-licenses_select-tight" ON public.kephis_seed_licenses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lab_results' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "lab_results_delete" ON public.lab_results;
    CREATE POLICY "lab-results_delete-tight" ON public.lab_results
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lab_results' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "lab_results_select" ON public.lab_results;
    CREATE POLICY "lab-results_select-tight" ON public.lab_results
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lab_results' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "lab_results_update" ON public.lab_results;
    CREATE POLICY "lab-results_update-tight" ON public.lab_results
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'languages' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own languages" ON public.languages;
    CREATE POLICY "languages_select-tight" ON public.languages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ledger_accounts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ledger_accounts" ON public.ledger_accounts;
    CREATE POLICY "ledger-accounts_select-tight" ON public.ledger_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ledger_entries' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ledger_entries" ON public.ledger_entries;
    CREATE POLICY "ledger-entries_select-tight" ON public.ledger_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ledger_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ledger_transactions" ON public.ledger_transactions;
    CREATE POLICY "ledger-transactions_select-tight" ON public.ledger_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'live_gifts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "live_gifts_read" ON public.live_gifts;
    CREATE POLICY "live-gifts_select-tight" ON public.live_gifts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'live_participants' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own live_participants" ON public.live_participants;
    CREATE POLICY "live-participants_select-tight" ON public.live_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'live_rooms' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "live_rooms_read" ON public.live_rooms;
    CREATE POLICY "live-rooms_select-tight" ON public.live_rooms
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'live_session_registrations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own live_session_registrations" ON public.live_session_registrations;
    CREATE POLICY "live-session-registrations_select-tight" ON public.live_session_registrations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'live_sessions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own live_sessions" ON public.live_sessions;
    CREATE POLICY "live-sessions_select-tight" ON public.live_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'live_streams' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own live_streams" ON public.live_streams;
    CREATE POLICY "live-streams_select-tight" ON public.live_streams
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'logistics_ai_decisions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own logistics_ai_decisions" ON public.logistics_ai_decisions;
    CREATE POLICY "logistics-ai-decisions_select-tight" ON public.logistics_ai_decisions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lost_items' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own lost_items" ON public.lost_items;
    CREATE POLICY "lost-items_select-tight" ON public.lost_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'maintenance_contractors' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own maintenance_contractors" ON public.maintenance_contractors;
    CREATE POLICY "maintenance-contractors_select-tight" ON public.maintenance_contractors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_escrow' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own marketplace_escrow" ON public.marketplace_escrow;
    CREATE POLICY "marketplace-escrow_select-tight" ON public.marketplace_escrow
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'missing_child_reports' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "missing_child_view" ON public.missing_child_reports;
    CREATE POLICY "missing-child-reports_select-tight" ON public.missing_child_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'moderation_queue' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own moderation_queue" ON public.moderation_queue;
    CREATE POLICY "moderation-queue_select-tight" ON public.moderation_queue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'moderation_rules' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own moderation_rules" ON public.moderation_rules;
    CREATE POLICY "moderation-rules_select-tight" ON public.moderation_rules
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'monetization_rules' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own monetization_rules" ON public.monetization_rules;
    CREATE POLICY "monetization-rules_select-tight" ON public.monetization_rules
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mpesa_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mpesa_transactions" ON public.mpesa_transactions;
    CREATE POLICY "mpesa-transactions_select-tight" ON public.mpesa_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_cluster_members' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_cluster_members" ON public.mtaa_cluster_members;
    CREATE POLICY "mtaa-cluster-members_select-tight" ON public.mtaa_cluster_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_cross_border_routes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_cross_border_routes" ON public.mtaa_cross_border_routes;
    CREATE POLICY "mtaa-cross-border-routes_select-tight" ON public.mtaa_cross_border_routes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_cross_border_settlements' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_cross_border_settlements" ON public.mtaa_cross_border_settlements;
    CREATE POLICY "mtaa-cross-border-settlements_select-tight" ON public.mtaa_cross_border_settlements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_digital_trade_flows' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_digital_trade_flows" ON public.mtaa_digital_trade_flows;
    CREATE POLICY "mtaa-digital-trade-flows_select-tight" ON public.mtaa_digital_trade_flows
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_driver_capabilities' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_driver_capabilities" ON public.mtaa_driver_capabilities;
    CREATE POLICY "mtaa-driver-capabilities_select-tight" ON public.mtaa_driver_capabilities
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_driver_clusters' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_driver_clusters" ON public.mtaa_driver_clusters;
    CREATE POLICY "mtaa-driver-clusters_select-tight" ON public.mtaa_driver_clusters
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

