-- ============================================
-- RLS TIGHTENING BATCH 14/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_payroll' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prison_read_all" ON public.prison_payroll;
    CREATE POLICY "prison-payroll_select-tight" ON public.prison_payroll
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_procurement' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prison_write_all" ON public.prison_procurement;
    CREATE POLICY "prison-procurement_all-tight" ON public.prison_procurement
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_procurement' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prison_read_all" ON public.prison_procurement;
    CREATE POLICY "prison-procurement_select-tight" ON public.prison_procurement
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_procurements' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own prison_procurements" ON public.prison_procurements;
    CREATE POLICY "prison-procurements_select-tight" ON public.prison_procurements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_staff_attendance' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prison_write_all" ON public.prison_staff_attendance;
    CREATE POLICY "prison-staff-attendance_all-tight" ON public.prison_staff_attendance
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_staff_attendance' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "prison_read_all" ON public.prison_staff_attendance;
    CREATE POLICY "prison-staff-attendance_select-tight" ON public.prison_staff_attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_visitors' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own prison_visitors" ON public.prison_visitors;
    CREATE POLICY "prison-visitors_select-tight" ON public.prison_visitors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prison_visits' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own prison_visits" ON public.prison_visits;
    CREATE POLICY "prison-visits_select-tight" ON public.prison_visits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'private_live_bookings' AND column_name = 'host_id'
  ) THEN
    DROP POLICY IF EXISTS "private_bookings_read" ON public.private_live_bookings;
    CREATE POLICY "private-live-bookings_select-tight" ON public.private_live_bookings
  FOR SELECT TO authenticated
  USING (host_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_reviews' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "product_reviews_select_public" ON public.product_reviews;
    CREATE POLICY "product-reviews_select-tight" ON public.product_reviews
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own projects" ON public.projects;
    CREATE POLICY "projects_select-tight" ON public.projects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_analytics' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own property_analytics" ON public.property_analytics;
    CREATE POLICY "property-analytics_select-tight" ON public.property_analytics
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_availability' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own property_availability" ON public.property_availability;
    CREATE POLICY "property-availability_select-tight" ON public.property_availability
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_documents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own property_documents" ON public.property_documents;
    CREATE POLICY "property-documents_select-tight" ON public.property_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_host_profiles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own property_host_profiles" ON public.property_host_profiles;
    CREATE POLICY "property-host-profiles_select-tight" ON public.property_host_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_messages' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own property_messages" ON public.property_messages;
    CREATE POLICY "property-messages_select-tight" ON public.property_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own provider_transactions" ON public.provider_transactions;
    CREATE POLICY "provider-transactions_select-tight" ON public.provider_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'public_participation_reactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own public_participation_reactions" ON public.public_participation_reactions;
    CREATE POLICY "public-participation-reactions_select-tight" ON public.public_participation_reactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_subscriptions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own push_subscriptions" ON public.push_subscriptions;
    CREATE POLICY "push-subscriptions_select-tight" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'referral_codes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Read referral codes" ON public.referral_codes;
    CREATE POLICY "referral-codes_select-tight" ON public.referral_codes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'referral_leaderboard' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own referral_leaderboard" ON public.referral_leaderboard;
    CREATE POLICY "referral-leaderboard_select-tight" ON public.referral_leaderboard
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'regulatory_businesses' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own regulatory_businesses" ON public.regulatory_businesses;
    CREATE POLICY "regulatory-businesses_select-tight" ON public.regulatory_businesses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'regulatory_compliance' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own regulatory_compliance" ON public.regulatory_compliance;
    CREATE POLICY "regulatory-compliance_select-tight" ON public.regulatory_compliance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'regulatory_reports' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own regulatory_reports" ON public.regulatory_reports;
    CREATE POLICY "regulatory-reports_select-tight" ON public.regulatory_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'regulatory_tax_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own regulatory_tax_payments" ON public.regulatory_tax_payments;
    CREATE POLICY "regulatory-tax-payments_select-tight" ON public.regulatory_tax_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'regulatory_tax_revenue' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own regulatory_tax_revenue" ON public.regulatory_tax_revenue;
    CREATE POLICY "regulatory-tax-revenue_select-tight" ON public.regulatory_tax_revenue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own reports" ON public.reports;
    CREATE POLICY "reports_select-tight" ON public.reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reputation_scores' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own reputation_scores" ON public.reputation_scores;
    CREATE POLICY "reputation-scores_select-tight" ON public.reputation_scores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_audits' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_write_all" ON public.revenue_audits;
    CREATE POLICY "revenue-audits_all-tight" ON public.revenue_audits
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenue_audits' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "revenue_read_all" ON public.revenue_audits;
    CREATE POLICY "revenue-audits_select-tight" ON public.revenue_audits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

