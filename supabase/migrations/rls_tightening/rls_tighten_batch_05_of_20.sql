-- ============================================
-- RLS TIGHTENING BATCH 5/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'delivery_history' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own delivery_history" ON public.delivery_history;
    CREATE POLICY "delivery-history_select-tight" ON public.delivery_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'device_assignments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "device_assignments_select_all" ON public.device_assignments;
    CREATE POLICY "device-assignments_select-tight" ON public.device_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'device_events' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own device_events" ON public.device_events;
    CREATE POLICY "device-events_select-tight" ON public.device_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'device_nodes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own device_nodes" ON public.device_nodes;
    CREATE POLICY "device-nodes_select-tight" ON public.device_nodes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'device_sync_state' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own device_sync_state" ON public.device_sync_state;
    CREATE POLICY "device-sync-state_select-tight" ON public.device_sync_state
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'devices' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "devices_select_all" ON public.devices;
    CREATE POLICY "devices_select-tight" ON public.devices
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dispatch_queue' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own dispatch_queue" ON public.dispatch_queue;
    CREATE POLICY "dispatch-queue_select-tight" ON public.dispatch_queue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dividend_pool' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own dividend_pool" ON public.dividend_pool;
    CREATE POLICY "dividend-pool_select-tight" ON public.dividend_pool
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own documents" ON public.documents;
    CREATE POLICY "documents_select-tight" ON public.documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'driver_gps_logs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own driver_gps_logs" ON public.driver_gps_logs;
    CREATE POLICY "driver-gps-logs_select-tight" ON public.driver_gps_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'driver_locations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own driver_locations" ON public.driver_locations;
    CREATE POLICY "driver-locations_select-tight" ON public.driver_locations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'driver_scores' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "driver_scores_all_access" ON public.driver_scores;
    CREATE POLICY "driver-scores_all-tight" ON public.driver_scores
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'driver_shield' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own driver_shield" ON public.driver_shield;
    CREATE POLICY "driver-shield_select-tight" ON public.driver_shield
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_class_schedules' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_class_schedules_delete" ON public.education_class_schedules;
    CREATE POLICY "education-class-schedules_delete-tight" ON public.education_class_schedules
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_class_schedules' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_class_schedules_select" ON public.education_class_schedules;
    CREATE POLICY "education-class-schedules_select-tight" ON public.education_class_schedules
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_class_schedules' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_class_schedules_update" ON public.education_class_schedules;
    CREATE POLICY "education-class-schedules_update-tight" ON public.education_class_schedules
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_events' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "event_select" ON public.education_events;
    CREATE POLICY "education-events_select-tight" ON public.education_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_exams' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_exams_delete" ON public.education_exams;
    CREATE POLICY "education-exams_delete-tight" ON public.education_exams
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_exams' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_exams_select" ON public.education_exams;
    CREATE POLICY "education-exams_select-tight" ON public.education_exams
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_exams' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_exams_update" ON public.education_exams;
    CREATE POLICY "education-exams_update-tight" ON public.education_exams
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_fee_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_fee_payments_delete" ON public.education_fee_payments;
    CREATE POLICY "education-fee-payments_delete-tight" ON public.education_fee_payments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_fee_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_fee_payments_select" ON public.education_fee_payments;
    CREATE POLICY "education-fee-payments_select-tight" ON public.education_fee_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_fee_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_fee_payments_update" ON public.education_fee_payments;
    CREATE POLICY "education-fee-payments_update-tight" ON public.education_fee_payments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_feed_likes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_feed_likes_delete" ON public.education_feed_likes;
    CREATE POLICY "education-feed-likes_delete-tight" ON public.education_feed_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_feed_likes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_feed_likes_select" ON public.education_feed_likes;
    CREATE POLICY "education-feed-likes_select-tight" ON public.education_feed_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_feed_likes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_feed_likes_update" ON public.education_feed_likes;
    CREATE POLICY "education-feed-likes_update-tight" ON public.education_feed_likes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_feed_posts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_feed_posts_delete" ON public.education_feed_posts;
    CREATE POLICY "education-feed-posts_delete-tight" ON public.education_feed_posts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_feed_posts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_feed_posts_select" ON public.education_feed_posts;
    CREATE POLICY "education-feed-posts_select-tight" ON public.education_feed_posts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_feed_posts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "education_feed_posts_update" ON public.education_feed_posts;
    CREATE POLICY "education-feed-posts_update-tight" ON public.education_feed_posts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_grades' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own education_grades" ON public.education_grades;
    CREATE POLICY "education-grades_select-tight" ON public.education_grades
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

