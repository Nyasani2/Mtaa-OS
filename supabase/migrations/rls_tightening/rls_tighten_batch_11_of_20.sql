-- ============================================
-- RLS TIGHTENING BATCH 11/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_events' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_events" ON public.mtaa_events;
    CREATE POLICY "mtaa-events_select-tight" ON public.mtaa_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_location_history' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_location_history" ON public.mtaa_location_history;
    CREATE POLICY "mtaa-location-history_select-tight" ON public.mtaa_location_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_mobility_tasks' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_mobility_tasks" ON public.mtaa_mobility_tasks;
    CREATE POLICY "mtaa-mobility-tasks_select-tight" ON public.mtaa_mobility_tasks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_mobility_zones' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_mobility_zones" ON public.mtaa_mobility_zones;
    CREATE POLICY "mtaa-mobility-zones_select-tight" ON public.mtaa_mobility_zones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_pricing_zones' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_pricing_zones" ON public.mtaa_pricing_zones;
    CREATE POLICY "mtaa-pricing-zones_select-tight" ON public.mtaa_pricing_zones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_realtime_channels' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_realtime_channels" ON public.mtaa_realtime_channels;
    CREATE POLICY "mtaa-realtime-channels_select-tight" ON public.mtaa_realtime_channels
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_treasury' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_treasury" ON public.mtaa_treasury;
    CREATE POLICY "mtaa-treasury_select-tight" ON public.mtaa_treasury
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_worker_reputation' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_worker_reputation" ON public.mtaa_worker_reputation;
    CREATE POLICY "mtaa-worker-reputation_select-tight" ON public.mtaa_worker_reputation
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaa_workforce' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaa_workforce" ON public.mtaa_workforce;
    CREATE POLICY "mtaa-workforce_select-tight" ON public.mtaa_workforce
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaxi_cargo_pool_joins' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaxi_cargo_pool_joins" ON public.mtaxi_cargo_pool_joins;
    CREATE POLICY "mtaxi-cargo-pool-joins_select-tight" ON public.mtaxi_cargo_pool_joins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaxi_cargo_pools' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaxi_cargo_pools" ON public.mtaxi_cargo_pools; DROP POLICY IF EXISTS "mtaxi_cargo_pools_select" ON public.mtaxi_cargo_pools;
    CREATE POLICY "mtaxi-cargo-pools_select-tight" ON public.mtaxi_cargo_pools
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaxi_carpool_passengers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaxi_carpool_passengers" ON public.mtaxi_carpool_passengers;
    CREATE POLICY "mtaxi-carpool-passengers_select-tight" ON public.mtaxi_carpool_passengers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaxi_delivery_confirmations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaxi_delivery_confirmations" ON public.mtaxi_delivery_confirmations;
    CREATE POLICY "mtaxi-delivery-confirmations_select-tight" ON public.mtaxi_delivery_confirmations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaxi_escrow_releases' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaxi_escrow_releases" ON public.mtaxi_escrow_releases;
    CREATE POLICY "mtaxi-escrow-releases_select-tight" ON public.mtaxi_escrow_releases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaxi_trip_events' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtaxi_trip_events" ON public.mtaxi_trip_events;
    CREATE POLICY "mtaxi-trip-events_select-tight" ON public.mtaxi_trip_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtaxi_vehicle_inspections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "mtaxi_vehicle_inspections_all_access" ON public.mtaxi_vehicle_inspections;
    CREATE POLICY "mtaxi-vehicle-inspections_all-tight" ON public.mtaxi_vehicle_inspections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_alerts' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_alerts" ON public.mtruck_alerts;
    CREATE POLICY "mtruck-alerts_select-tight" ON public.mtruck_alerts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_bids' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_bids" ON public.mtruck_bids;
    CREATE POLICY "mtruck-bids_select-tight" ON public.mtruck_bids
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_customs_clearance' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "customs_clearance_all_access" ON public.mtruck_customs_clearance;
    CREATE POLICY "mtruck-customs-clearance_all-tight" ON public.mtruck_customs_clearance
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_customs_clearance' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_customs_clearance" ON public.mtruck_customs_clearance;
    CREATE POLICY "mtruck-customs-clearance_select-tight" ON public.mtruck_customs_clearance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_deliveries' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "deliveries_all_access" ON public.mtruck_deliveries;
    CREATE POLICY "mtruck-deliveries_all-tight" ON public.mtruck_deliveries
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_deliveries' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_deliveries" ON public.mtruck_deliveries;
    CREATE POLICY "mtruck-deliveries_select-tight" ON public.mtruck_deliveries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_driver_tokens' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "driver_tokens_all_access" ON public.mtruck_driver_tokens;
    CREATE POLICY "mtruck-driver-tokens_all-tight" ON public.mtruck_driver_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_driver_tokens' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_driver_tokens" ON public.mtruck_driver_tokens;
    CREATE POLICY "mtruck-driver-tokens_select-tight" ON public.mtruck_driver_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_drivers' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_drivers" ON public.mtruck_drivers;
    CREATE POLICY "mtruck-drivers_select-tight" ON public.mtruck_drivers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_equipment_bookings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_equipment_bookings" ON public.mtruck_equipment_bookings;
    CREATE POLICY "mtruck-equipment-bookings_select-tight" ON public.mtruck_equipment_bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_fleet' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_fleet" ON public.mtruck_fleet;
    CREATE POLICY "mtruck-fleet_select-tight" ON public.mtruck_fleet
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_fleet_commands' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "fleet_commands_all_access" ON public.mtruck_fleet_commands;
    CREATE POLICY "mtruck-fleet-commands_all-tight" ON public.mtruck_fleet_commands
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_fleet_commands' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_fleet_commands" ON public.mtruck_fleet_commands;
    CREATE POLICY "mtruck-fleet-commands_select-tight" ON public.mtruck_fleet_commands
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_freight_auctions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_freight_auctions" ON public.mtruck_freight_auctions;
    CREATE POLICY "mtruck-freight-auctions_select-tight" ON public.mtruck_freight_auctions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

