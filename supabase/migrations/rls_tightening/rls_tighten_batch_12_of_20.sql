-- ============================================
-- RLS TIGHTENING BATCH 12/20
-- Tightens "always-true" SELECT/ALL policies to auth.uid() = user_col
-- Safe: wrapped in DO blocks with column existence checks
-- Run in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_freight_bids' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_freight_bids" ON public.mtruck_freight_bids;
    CREATE POLICY "mtruck-freight-bids_select-tight" ON public.mtruck_freight_bids
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_freight_settlements' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_freight_settlements" ON public.mtruck_freight_settlements;
    CREATE POLICY "mtruck-freight-settlements_select-tight" ON public.mtruck_freight_settlements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_haul_quotes' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_haul_quotes" ON public.mtruck_haul_quotes;
    CREATE POLICY "mtruck-haul-quotes_select-tight" ON public.mtruck_haul_quotes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_heavy_equipment' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_heavy_equipment" ON public.mtruck_heavy_equipment;
    CREATE POLICY "mtruck-heavy-equipment_select-tight" ON public.mtruck_heavy_equipment
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_incidents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "incidents_all_access" ON public.mtruck_incidents;
    CREATE POLICY "mtruck-incidents_all-tight" ON public.mtruck_incidents
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_incidents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_incidents" ON public.mtruck_incidents;
    CREATE POLICY "mtruck-incidents_select-tight" ON public.mtruck_incidents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_inspections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "inspections_all_access" ON public.mtruck_inspections;
    CREATE POLICY "mtruck-inspections_all-tight" ON public.mtruck_inspections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_inspections' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_inspections" ON public.mtruck_inspections;
    CREATE POLICY "mtruck-inspections_select-tight" ON public.mtruck_inspections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_jobs' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_jobs" ON public.mtruck_jobs;
    CREATE POLICY "mtruck-jobs_select-tight" ON public.mtruck_jobs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_listings' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_listings" ON public.mtruck_listings;
    CREATE POLICY "mtruck-listings_select-tight" ON public.mtruck_listings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_loads' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_loads" ON public.mtruck_loads;
    CREATE POLICY "mtruck-loads_select-tight" ON public.mtruck_loads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_locations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "locations_all_access" ON public.mtruck_locations;
    CREATE POLICY "mtruck-locations_all-tight" ON public.mtruck_locations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_locations' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_locations" ON public.mtruck_locations;
    CREATE POLICY "mtruck-locations_select-tight" ON public.mtruck_locations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_marketplace' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_marketplace" ON public.mtruck_marketplace;
    CREATE POLICY "mtruck-marketplace_select-tight" ON public.mtruck_marketplace
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_messages' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_messages" ON public.mtruck_messages;
    CREATE POLICY "mtruck-messages_select-tight" ON public.mtruck_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_port_shipments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "port_shipments_all_access" ON public.mtruck_port_shipments;
    CREATE POLICY "mtruck-port-shipments_all-tight" ON public.mtruck_port_shipments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_port_shipments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_port_shipments" ON public.mtruck_port_shipments;
    CREATE POLICY "mtruck-port-shipments_select-tight" ON public.mtruck_port_shipments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_shipments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_shipments" ON public.mtruck_shipments;
    CREATE POLICY "mtruck-shipments_select-tight" ON public.mtruck_shipments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_shipper_requests' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_shipper_requests" ON public.mtruck_shipper_requests;
    CREATE POLICY "mtruck-shipper-requests_select-tight" ON public.mtruck_shipper_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mtruck_trucks' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own mtruck_trucks" ON public.mtruck_trucks;
    CREATE POLICY "mtruck-trucks_select-tight" ON public.mtruck_trucks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Allow anonymous reads on order_items" ON public.order_items; DROP POLICY IF EXISTS "Users view own order_items" ON public.order_items;
    CREATE POLICY "order-items_select-tight" ON public.order_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Allow anonymous reads on orders" ON public.orders; DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
    CREATE POLICY "orders_select-tight" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Allow anonymous updates on orders" ON public.orders;
    CREATE POLICY "orders_update-tight" ON public.orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'org_roles' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own org_roles" ON public.org_roles;
    CREATE POLICY "org-roles_select-tight" ON public.org_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partner_complaints' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own partner_complaints" ON public.partner_complaints;
    CREATE POLICY "partner-complaints_select-tight" ON public.partner_complaints
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partner_status' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own partner_status" ON public.partner_status;
    CREATE POLICY "partner-status_select-tight" ON public.partner_status
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partner_transactions' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own partner_transactions" ON public.partner_transactions;
    CREATE POLICY "partner-transactions_select-tight" ON public.partner_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'paybill_payments' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own paybill_payments" ON public.paybill_payments;
    CREATE POLICY "paybill-payments_select-tight" ON public.paybill_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_idempotency' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own payment_idempotency" ON public.payment_idempotency;
    CREATE POLICY "payment-idempotency_select-tight" ON public.payment_idempotency
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_intents' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users view own payment_intents" ON public.payment_intents;
    CREATE POLICY "payment-intents_select-tight" ON public.payment_intents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  END IF;
END $$;

