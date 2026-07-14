-- ============================================
-- RLS TIGHTENING BATCH 1/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'account_members' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own account_members" ON public.account_members;
    CREATE POLICY "account-members_select-tight" ON public.account_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'account_roles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own account_roles" ON public.account_roles;
    CREATE POLICY "account-roles_select-tight" ON public.account_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accounting_categories' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "cat_public" ON public.accounting_categories;
    CREATE POLICY "accounting-categories_select-tight" ON public.accounting_categories
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accountings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own accountings" ON public.accountings;
    CREATE POLICY "accountings_select-tight" ON public.accountings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'active_governance_members' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own active_governance_members" ON public.active_governance_members;
    CREATE POLICY "active-governance-members_select-tight" ON public.active_governance_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ad_campaigns" ON public.ad_campaigns;
    CREATE POLICY "ad-campaigns_select-tight" ON public.ad_campaigns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_creatives' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ad_creatives" ON public.ad_creatives;
    CREATE POLICY "ad-creatives_select-tight" ON public.ad_creatives
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_impressions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ad_impressions" ON public.ad_impressions;
    CREATE POLICY "ad-impressions_select-tight" ON public.ad_impressions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_impressions_v2' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ad_impressions_v2" ON public.ad_impressions_v2;
    CREATE POLICY "ad-impressions-v2_select-tight" ON public.ad_impressions_v2
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_views' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ad_views" ON public.ad_views;
    CREATE POLICY "ad-views_select-tight" ON public.ad_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ads' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ads" ON public.ads;
    CREATE POLICY "ads_select-tight" ON public.ads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'adverts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own adverts" ON public.adverts;
    CREATE POLICY "adverts_select-tight" ON public.adverts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agent_commissions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own agent_commissions" ON public.agent_commissions;
    CREATE POLICY "agent-commissions_select-tight" ON public.agent_commissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Agents are viewable" ON public.agents;
    CREATE POLICY "agents_select-tight" ON public.agents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_admin_logs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ai_admin_logs" ON public.ai_admin_logs;
    CREATE POLICY "ai-admin-logs_select-tight" ON public.ai_admin_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_admins' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ai_admins" ON public.ai_admins;
    CREATE POLICY "ai-admins_select-tight" ON public.ai_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_moderation_flags' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Read moderation flags" ON public.ai_moderation_flags;
    CREATE POLICY "ai-moderation-flags_select-tight" ON public.ai_moderation_flags
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_signals' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own ai_signals" ON public.ai_signals;
    CREATE POLICY "ai-signals_select-tight" ON public.ai_signals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_folders' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own app_folders" ON public.app_folders;
    CREATE POLICY "app-folders_select-tight" ON public.app_folders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_notifications' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own app_notifications" ON public.app_notifications;
    CREATE POLICY "app-notifications_select-tight" ON public.app_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_revenue' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own app_revenue" ON public.app_revenue;
    CREATE POLICY "app-revenue_select-tight" ON public.app_revenue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_reviews' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users can view all reviews" ON public.app_reviews;
    CREATE POLICY "app-reviews_select-tight" ON public.app_reviews
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_verification_events' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own app_verification_events" ON public.app_verification_events;
    CREATE POLICY "app-verification-events_select-tight" ON public.app_verification_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_verification_requests' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own app_verification_requests" ON public.app_verification_requests;
    CREATE POLICY "app-verification-requests_select-tight" ON public.app_verification_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_widgets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own app_widgets" ON public.app_widgets;
    CREATE POLICY "app-widgets_select-tight" ON public.app_widgets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "assets_delete" ON public.assets;
    CREATE POLICY "assets_delete-tight" ON public.assets
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "assets_select" ON public.assets;
    CREATE POLICY "assets_select-tight" ON public.assets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "assets_update" ON public.assets;
    CREATE POLICY "assets_update-tight" ON public.assets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auto_pay_rules' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own auto_pay_rules" ON public.auto_pay_rules;
    CREATE POLICY "auto-pay-rules_select-tight" ON public.auto_pay_rules
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
    DROP POLICY IF EXISTS "avatars_delete" ON public.avatars;
    CREATE POLICY "avatars_delete-tight" ON public.avatars
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

