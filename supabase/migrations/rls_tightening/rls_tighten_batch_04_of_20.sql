-- ============================================
-- RLS TIGHTENING BATCH 4/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_earnings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own content_earnings" ON public.content_earnings;
    CREATE POLICY "content-earnings_select-tight" ON public.content_earnings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_engagement' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own content_engagement" ON public.content_engagement;
    CREATE POLICY "content-engagement_select-tight" ON public.content_engagement
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_moderation' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own content_moderation" ON public.content_moderation;
    CREATE POLICY "content-moderation_select-tight" ON public.content_moderation
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversation_participants' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own conversation_participants" ON public.conversation_participants;
    CREATE POLICY "conversation-participants_select-tight" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own conversations" ON public.conversations;
    CREATE POLICY "conversations_select-tight" ON public.conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'county_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own county_transactions" ON public.county_transactions;
    CREATE POLICY "county-transactions_select-tight" ON public.county_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_appeals' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_appeals" ON public.court_appeals;
    CREATE POLICY "court-appeals_select-tight" ON public.court_appeals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_bails' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "court_bails_delete" ON public.court_bails;
    CREATE POLICY "court-bails_delete-tight" ON public.court_bails
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_bails' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_bails" ON public.court_bails; DROP POLICY IF EXISTS "court_bails_select" ON public.court_bails;
    CREATE POLICY "court-bails_select-tight" ON public.court_bails
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_bails' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "court_bails_update" ON public.court_bails;
    CREATE POLICY "court-bails_update-tight" ON public.court_bails
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_cases' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_cases" ON public.court_cases;
    CREATE POLICY "court-cases_select-tight" ON public.court_cases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_fines' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_fines" ON public.court_fines;
    CREATE POLICY "court-fines_select-tight" ON public.court_fines
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_hearings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_hearings" ON public.court_hearings;
    CREATE POLICY "court-hearings_select-tight" ON public.court_hearings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_judgments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_judgments" ON public.court_judgments;
    CREATE POLICY "court-judgments_select-tight" ON public.court_judgments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_jurors' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "court_jurors_delete" ON public.court_jurors;
    CREATE POLICY "court-jurors_delete-tight" ON public.court_jurors
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_jurors' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_jurors" ON public.court_jurors; DROP POLICY IF EXISTS "court_jurors_select" ON public.court_jurors;
    CREATE POLICY "court-jurors_select-tight" ON public.court_jurors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_jurors' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "court_jurors_update" ON public.court_jurors;
    CREATE POLICY "court-jurors_update-tight" ON public.court_jurors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_jury_assignments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "court_jury_assignments_delete" ON public.court_jury_assignments;
    CREATE POLICY "court-jury-assignments_delete-tight" ON public.court_jury_assignments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_jury_assignments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_jury_assignments" ON public.court_jury_assignments; DROP POLICY IF EXISTS "court_jury_assignments_select" ON public.court_jury_assignments;
    CREATE POLICY "court-jury-assignments_select-tight" ON public.court_jury_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_jury_assignments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "court_jury_assignments_update" ON public.court_jury_assignments;
    CREATE POLICY "court-jury-assignments_update-tight" ON public.court_jury_assignments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_parties' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_parties" ON public.court_parties;
    CREATE POLICY "court-parties_select-tight" ON public.court_parties
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_procurement' AND column_name = 'requested_by'
  ) THEN
    DROP POLICY IF EXISTS "court_procurement_delete" ON public.court_procurement;
    CREATE POLICY "court-procurement_delete-tight" ON public.court_procurement
  FOR DELETE TO authenticated
  USING (requested_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_procurement' AND column_name = 'requested_by'
  ) THEN
    DROP POLICY IF EXISTS "court_procurement_select" ON public.court_procurement;
    CREATE POLICY "court-procurement_select-tight" ON public.court_procurement
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_procurement' AND column_name = 'requested_by'
  ) THEN
    DROP POLICY IF EXISTS "court_procurement_update" ON public.court_procurement;
    CREATE POLICY "court-procurement_update-tight" ON public.court_procurement
  FOR UPDATE TO authenticated
  USING (requested_by = auth.uid())
  WITH CHECK (requested_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'court_procurements' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own court_procurements" ON public.court_procurements;
    CREATE POLICY "court-procurements_select-tight" ON public.court_procurements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_withdrawals' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own creator_withdrawals" ON public.creator_withdrawals;
    CREATE POLICY "creator-withdrawals_select-tight" ON public.creator_withdrawals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creators' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own creators" ON public.creators;
    CREATE POLICY "creators_select-tight" ON public.creators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_accounts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own credit_accounts" ON public.credit_accounts;
    CREATE POLICY "credit-accounts_select-tight" ON public.credit_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_loans' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own credit_loans" ON public.credit_loans;
    CREATE POLICY "credit-loans_select-tight" ON public.credit_loans
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crypto_balances' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own crypto_balances" ON public.crypto_balances;
    CREATE POLICY "crypto-balances_select-tight" ON public.crypto_balances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

