-- ============================================
-- RLS TIGHTENING BATCH 17/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_likes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_likes" ON public.streets_likes;
    CREATE POLICY "streets-likes_select-tight" ON public.streets_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_live_comments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_live_comments" ON public.streets_live_comments;
    CREATE POLICY "streets-live-comments_select-tight" ON public.streets_live_comments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_live_viewers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_live_viewers" ON public.streets_live_viewers;
    CREATE POLICY "streets-live-viewers_select-tight" ON public.streets_live_viewers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_messages' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_messages" ON public.streets_messages;
    CREATE POLICY "streets-messages_select-tight" ON public.streets_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_notifications' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_notifications" ON public.streets_notifications;
    CREATE POLICY "streets-notifications_select-tight" ON public.streets_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_posts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_posts" ON public.streets_posts;
    CREATE POLICY "streets-posts_select-tight" ON public.streets_posts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_reports' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_reports" ON public.streets_reports;
    CREATE POLICY "streets-reports_select-tight" ON public.streets_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_saves' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_saves" ON public.streets_saves;
    CREATE POLICY "streets-saves_select-tight" ON public.streets_saves
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_shares' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_shares" ON public.streets_shares;
    CREATE POLICY "streets-shares_select-tight" ON public.streets_shares
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_views' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "streets_views_all_access" ON public.streets_views;
    CREATE POLICY "streets-views_all-tight" ON public.streets_views
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'streets_views' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own streets_views" ON public.streets_views;
    CREATE POLICY "streets-views_select-tight" ON public.streets_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'studio_podcast_episodes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own studio_podcast_episodes" ON public.studio_podcast_episodes;
    CREATE POLICY "studio-podcast-episodes_select-tight" ON public.studio_podcast_episodes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'studio_scene_detections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own studio_scene_detections" ON public.studio_scene_detections;
    CREATE POLICY "studio-scene-detections_select-tight" ON public.studio_scene_detections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'studio_stream_switches' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own studio_stream_switches" ON public.studio_stream_switches;
    CREATE POLICY "studio-stream-switches_select-tight" ON public.studio_stream_switches
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sub_wallets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own sub_wallets" ON public.sub_wallets;
    CREATE POLICY "sub-wallets_select-tight" ON public.sub_wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own support_tickets" ON public.support_tickets;
    CREATE POLICY "support-tickets_select-tight" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reports' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tax_reports" ON public.tax_reports;
    CREATE POLICY "tax-reports_select-tight" ON public.tax_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_statements' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tax_statements" ON public.tax_statements;
    CREATE POLICY "tax-statements_select-tight" ON public.tax_statements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own tax_transactions" ON public.tax_transactions;
    CREATE POLICY "tax-transactions_select-tight" ON public.tax_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'till_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own till_payments" ON public.till_payments;
    CREATE POLICY "till-payments_select-tight" ON public.till_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transaction_receipts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own transaction_receipts" ON public.transaction_receipts;
    CREATE POLICY "transaction-receipts_select-tight" ON public.transaction_receipts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;
    CREATE POLICY "transactions_delete-tight" ON public.transactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
    CREATE POLICY "transactions_select-tight" ON public.transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
    CREATE POLICY "transactions_update-tight" ON public.transactions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'translations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own translations" ON public.translations;
    CREATE POLICY "translations_select-tight" ON public.translations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_accounts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "treasury_accounts_isolation" ON public.treasury_accounts;
    CREATE POLICY "treasury-accounts_all-tight" ON public.treasury_accounts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_accounts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_accounts" ON public.treasury_accounts;
    CREATE POLICY "treasury-accounts_select-tight" ON public.treasury_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_assets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_assets" ON public.treasury_assets;
    CREATE POLICY "treasury-assets_select-tight" ON public.treasury_assets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_audit_findings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_audit_findings" ON public.treasury_audit_findings;
    CREATE POLICY "treasury-audit-findings_select-tight" ON public.treasury_audit_findings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_audit_logs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own treasury_audit_logs" ON public.treasury_audit_logs;
    CREATE POLICY "treasury-audit-logs_select-tight" ON public.treasury_audit_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

