-- ============================================
-- RLS TIGHTENING BATCH 8/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'facilities' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "facilities_select" ON public.facilities;
    CREATE POLICY "facilities_select-tight" ON public.facilities
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'facilities' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "facilities_update" ON public.facilities;
    CREATE POLICY "facilities_update-tight" ON public.facilities
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own favorites" ON public.favorites;
    CREATE POLICY "favorites_select-tight" ON public.favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'feed_events' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own feed_events" ON public.feed_events;
    CREATE POLICY "feed-events_select-tight" ON public.feed_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'feed_presence' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own feed_presence" ON public.feed_presence;
    CREATE POLICY "feed-presence_select-tight" ON public.feed_presence
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'feed_rankings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own feed_rankings" ON public.feed_rankings;
    CREATE POLICY "feed-rankings_select-tight" ON public.feed_rankings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'feed_signals' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own feed_signals" ON public.feed_signals;
    CREATE POLICY "feed-signals_select-tight" ON public.feed_signals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_profiles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own financial_profiles" ON public.financial_profiles;
    CREATE POLICY "financial-profiles_select-tight" ON public.financial_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'followers' AND column_name = 'follower_id'
  ) THEN
    DROP POLICY IF EXISTS "followers_select" ON public.followers;
    CREATE POLICY "followers_select-tight" ON public.followers
  FOR SELECT TO authenticated
  USING (follower_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fraud_alerts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own fraud_alerts" ON public.fraud_alerts;
    CREATE POLICY "fraud-alerts_select-tight" ON public.fraud_alerts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fraud_logs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own fraud_logs" ON public.fraud_logs;
    CREATE POLICY "fraud-logs_select-tight" ON public.fraud_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'freight_bids' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own freight_bids" ON public.freight_bids;
    CREATE POLICY "freight-bids_select-tight" ON public.freight_bids
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'freight_contracts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own freight_contracts" ON public.freight_contracts;
    CREATE POLICY "freight-contracts_select-tight" ON public.freight_contracts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'freight_dispatches' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "freight_dispatches_delete" ON public.freight_dispatches;
    CREATE POLICY "freight-dispatches_delete-tight" ON public.freight_dispatches
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'freight_dispatches' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "freight_dispatches_select" ON public.freight_dispatches;
    CREATE POLICY "freight-dispatches_select-tight" ON public.freight_dispatches
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'freight_dispatches' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "freight_dispatches_update" ON public.freight_dispatches;
    CREATE POLICY "freight-dispatches_update-tight" ON public.freight_dispatches
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'freight_driver_locations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own freight_driver_locations" ON public.freight_driver_locations;
    CREATE POLICY "freight-driver-locations_select-tight" ON public.freight_driver_locations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'freight_marketplace' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own freight_marketplace" ON public.freight_marketplace;
    CREATE POLICY "freight-marketplace_select-tight" ON public.freight_marketplace
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'freight_orders' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own freight_orders" ON public.freight_orders;
    CREATE POLICY "freight-orders_select-tight" ON public.freight_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'freight_trips' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own freight_trips" ON public.freight_trips;
    CREATE POLICY "freight-trips_select-tight" ON public.freight_trips
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'garage_parts_used' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own garage_parts_used" ON public.garage_parts_used;
    CREATE POLICY "garage-parts-used_select-tight" ON public.garage_parts_used
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gift_catalog' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "gift_catalog_read" ON public.gift_catalog;
    CREATE POLICY "gift-catalog_select-tight" ON public.gift_catalog
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gifts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own gifts" ON public.gifts;
    CREATE POLICY "gifts_select-tight" ON public.gifts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'go_fund' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own go_fund" ON public.go_fund;
    CREATE POLICY "go-fund_select-tight" ON public.go_fund
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gofund_accounts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own gofund_accounts" ON public.gofund_accounts;
    CREATE POLICY "gofund-accounts_select-tight" ON public.gofund_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gofund_debts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own gofund_debts" ON public.gofund_debts;
    CREATE POLICY "gofund-debts_select-tight" ON public.gofund_debts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gofund_settings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own gofund_settings" ON public.gofund_settings;
    CREATE POLICY "gofund-settings_select-tight" ON public.gofund_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gps_flags' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own gps_flags" ON public.gps_flags;
    CREATE POLICY "gps-flags_select-tight" ON public.gps_flags
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_admissions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_admissions_delete" ON public.health_admissions;
    CREATE POLICY "health-admissions_delete-tight" ON public.health_admissions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_admissions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "health_admissions_select" ON public.health_admissions;
    CREATE POLICY "health-admissions_select-tight" ON public.health_admissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

