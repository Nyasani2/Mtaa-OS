-- ============================================
-- RLS TIGHTENING BATCH 13/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_qr' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own payment_qr" ON public.payment_qr;
    CREATE POLICY "payment-qr_select-tight" ON public.payment_qr
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_refunds' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own payment_refunds" ON public.payment_refunds;
    CREATE POLICY "payment-refunds_select-tight" ON public.payment_refunds
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'phone_registry' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own phone_registry" ON public.phone_registry;
    CREATE POLICY "phone-registry_select-tight" ON public.phone_registry
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'platform_fees' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own platform_fees" ON public.platform_fees;
    CREATE POLICY "platform-fees_select-tight" ON public.platform_fees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'platform_revenue' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own platform_revenue" ON public.platform_revenue;
    CREATE POLICY "platform-revenue_select-tight" ON public.platform_revenue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'platform_shares' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own platform_shares" ON public.platform_shares;
    CREATE POLICY "platform-shares_select-tight" ON public.platform_shares
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'police_emergency_calls' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own police_emergency_calls" ON public.police_emergency_calls;
    CREATE POLICY "police-emergency-calls_select-tight" ON public.police_emergency_calls
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'police_officers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own police_officers" ON public.police_officers;
    CREATE POLICY "police-officers_select-tight" ON public.police_officers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'police_patrols' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own police_patrols" ON public.police_patrols;
    CREATE POLICY "police-patrols_select-tight" ON public.police_patrols
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'poll_votes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own poll_votes" ON public.poll_votes;
    CREATE POLICY "poll-votes_select-tight" ON public.poll_votes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pool_contributions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own pool_contributions" ON public.pool_contributions;
    CREATE POLICY "pool-contributions_select-tight" ON public.pool_contributions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pool_members' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own pool_members" ON public.pool_members;
    CREATE POLICY "pool-members_select-tight" ON public.pool_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_comments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "comments_public_read" ON public.post_comments;
    CREATE POLICY "post-comments_select-tight" ON public.post_comments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_hashtags' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own post_hashtags" ON public.post_hashtags;
    CREATE POLICY "post-hashtags_select-tight" ON public.post_hashtags
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_likes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can read likes" ON public.post_likes; DROP POLICY IF EXISTS "Read likes" ON public.post_likes; DROP POLICY IF EXISTS "likes_public_read" ON public.post_likes;
    CREATE POLICY "post-likes_select-tight" ON public.post_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_shares' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Read shares" ON public.post_shares;
    CREATE POLICY "post-shares_select-tight" ON public.post_shares
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_stats' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "post_stats_read" ON public.post_stats; DROP POLICY IF EXISTS "read post stats" ON public.post_stats; DROP POLICY IF EXISTS "read_post_stats" ON public.post_stats;
    CREATE POLICY "post-stats_select-tight" ON public.post_stats
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_tags' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "post_tags_read" ON public.post_tags;
    CREATE POLICY "post-tags_select-tight" ON public.post_tags
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_tips' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Read tips" ON public.post_tips;
    CREATE POLICY "post-tips_select-tight" ON public.post_tips
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_tracks_usage' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "post_tracks_usage_read" ON public.post_tracks_usage;
    CREATE POLICY "post-tracks-usage_select-tight" ON public.post_tracks_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prescriptions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prescriptions_delete" ON public.prescriptions;
    CREATE POLICY "prescriptions_delete-tight" ON public.prescriptions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prescriptions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prescriptions_select" ON public.prescriptions;
    CREATE POLICY "prescriptions_select-tight" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prescriptions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prescriptions_update" ON public.prescriptions;
    CREATE POLICY "prescriptions_update-tight" ON public.prescriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_incidents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prison_write_all" ON public.prison_incidents;
    CREATE POLICY "prison-incidents_all-tight" ON public.prison_incidents
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_incidents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prison_read_all" ON public.prison_incidents;
    CREATE POLICY "prison-incidents_select-tight" ON public.prison_incidents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_inmates' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own prison_inmates" ON public.prison_inmates;
    CREATE POLICY "prison-inmates_select-tight" ON public.prison_inmates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_movements' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own prison_movements" ON public.prison_movements;
    CREATE POLICY "prison-movements_select-tight" ON public.prison_movements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_parole_reviews' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prison_write_all" ON public.prison_parole_reviews;
    CREATE POLICY "prison-parole-reviews_all-tight" ON public.prison_parole_reviews
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_parole_reviews' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own prison_parole_reviews" ON public.prison_parole_reviews; DROP POLICY IF EXISTS "prison_read_all" ON public.prison_parole_reviews;
    CREATE POLICY "prison-parole-reviews_select-tight" ON public.prison_parole_reviews
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_payroll' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prison_write_all" ON public.prison_payroll;
    CREATE POLICY "prison-payroll_all-tight" ON public.prison_payroll
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

