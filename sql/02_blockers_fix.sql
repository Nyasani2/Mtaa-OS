-- ============================================================
-- MTAA TRANSPORT BLOCKERS FIX
-- Push tokens, cancel/refund, driver accept, hold balance
-- ============================================================

-- 1. Push tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform text NOT NULL DEFAULT 'expo',
    device_type text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, token)
);

-- 2. Add hold_balance support columns to mtaxi_rides
ALTER TABLE mtaxi_rides
ADD COLUMN IF NOT EXISTS fare_held boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fare_held_at timestamptz,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_by uuid,
ADD COLUMN IF NOT EXISTS cancellation_fee numeric DEFAULT 0;

-- 3. Hold fare when driver accepts (pre-authorization)
CREATE OR REPLACE FUNCTION public.hold_ride_fare(ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride record;
  v_user_wallet record;
  v_fare numeric;
BEGIN
  SELECT * INTO v_ride FROM mtaxi_rides WHERE id = ride_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Ride not found'); END IF;
  IF v_ride.fare_held THEN RETURN jsonb_build_object('error', 'Fare already held'); END IF;

  v_fare := COALESCE(v_ride.fare_estimate, 0);
  IF v_fare <= 0 THEN RETURN jsonb_build_object('error', 'Invalid fare'); END IF;

  SELECT id, balance, available_balance INTO v_user_wallet FROM wallet_accounts
  WHERE user_id = v_ride.passenger_id AND currency = 'KES' AND status = 'active'
  ORDER BY is_default DESC LIMIT 1;

  IF v_user_wallet.id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active wallet');
  END IF;

  IF v_user_wallet.available_balance < v_fare THEN
    RETURN jsonb_build_object('error', 'Insufficient balance for hold');
  END IF;

  -- Move from available to hold
  UPDATE wallet_accounts SET
    available_balance = available_balance - v_fare,
    hold_balance = hold_balance + v_fare,
    updated_at = now()
  WHERE id = v_user_wallet.id;

  UPDATE mtaxi_rides SET
    fare_held = true,
    fare_held_at = now(),
    updated_at = now()
  WHERE id = ride_id;

  INSERT INTO wallet_transactions (
    user_id, wallet_id, type, amount, currency, status, description,
    reference_id, reference_type, metadata
  ) VALUES (
    v_ride.passenger_id, v_user_wallet.id, 'hold', v_fare, 'KES', 'completed',
    'Fare held for ride ' || ride_id,
    ride_id, 'mtaxi_ride', jsonb_build_object('direction', 'hold', 'held_amount', v_fare)
  );

  RETURN jsonb_build_object('success', true, 'ride_id', ride_id, 'held', v_fare);
END;
$$;

-- 4. Release hold on cancel (full refund)
CREATE OR REPLACE FUNCTION public.release_ride_hold(ride_id uuid, p_cancelled_by uuid DEFAULT NULL, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride record;
  v_user_wallet record;
  v_fare numeric;
BEGIN
  SELECT * INTO v_ride FROM mtaxi_rides WHERE id = ride_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Ride not found'); END IF;
  IF NOT v_ride.fare_held THEN RETURN jsonb_build_object('error', 'No fare held'); END IF;

  v_fare := COALESCE(v_ride.fare_estimate, 0);

  SELECT id INTO v_user_wallet FROM wallet_accounts
  WHERE user_id = v_ride.passenger_id AND currency = 'KES'
  ORDER BY is_default DESC LIMIT 1;

  IF v_user_wallet.id IS NOT NULL THEN
    UPDATE wallet_accounts SET
      available_balance = available_balance + v_fare,
      hold_balance = hold_balance - v_fare,
      updated_at = now()
    WHERE id = v_user_wallet.id;

    INSERT INTO wallet_transactions (
      user_id, wallet_id, type, amount, currency, status, description,
      reference_id, reference_type, metadata
    ) VALUES (
      v_ride.passenger_id, v_user_wallet.id, 'refund', v_fare, 'KES', 'completed',
      'Fare refunded — ride cancelled: ' || COALESCE(p_reason, 'No reason'),
      ride_id, 'mtaxi_ride', jsonb_build_object('direction', 'refund', 'cancelled_by', p_cancelled_by)
    );
  END IF;

  UPDATE mtaxi_rides SET
    status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = p_reason,
    cancelled_by = p_cancelled_by,
    fare_held = false,
    updated_at = now()
  WHERE id = ride_id;

  RETURN jsonb_build_object('success', true, 'ride_id', ride_id, 'refunded', v_fare);
END;
$$;

-- 5. Driver accept ride + hold fare
CREATE OR REPLACE FUNCTION public.driver_accept_ride(p_ride_id uuid, p_driver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride record;
  v_driver record;
  v_hold_result jsonb;
BEGIN
  SELECT * INTO v_ride FROM mtaxi_rides WHERE id = p_ride_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Ride not found'); END IF;
  IF v_ride.status != 'searching' THEN RETURN jsonb_build_object('error', 'Ride not available', 'status', v_ride.status); END IF;

  SELECT * INTO v_driver FROM mtaxi_drivers WHERE id = p_driver_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Driver not found'); END IF;
  IF NOT v_driver.is_online THEN RETURN jsonb_build_object('error', 'Driver is offline'); END IF;
  IF NOT v_driver.is_active THEN RETURN jsonb_build_object('error', 'Driver is inactive'); END IF;
  IF NOT v_driver.background_check_passed THEN RETURN jsonb_build_object('error', 'Driver not approved'); END IF;

  -- Hold fare first
  v_hold_result := public.hold_ride_fare(p_ride_id);
  IF NOT (v_hold_result->>'success')::boolean THEN
    RETURN jsonb_build_object('error', 'Failed to hold fare', 'details', v_hold_result);
  END IF;

  -- Assign driver
  UPDATE mtaxi_rides SET
    driver_id = p_driver_id,
    vehicle_id = (SELECT id FROM mtaxi_vehicles WHERE driver_id = p_driver_id AND is_active = true LIMIT 1),
    status = 'accepted',
    accepted_at = now(),
    updated_at = now()
  WHERE id = p_ride_id;

  RETURN jsonb_build_object('success', true, 'ride_id', p_ride_id, 'driver_id', p_driver_id);
END;
$$;

-- 6. Update ride status (arrived, started, completed)
CREATE OR REPLACE FUNCTION public.update_ride_status(p_ride_id uuid, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride record;
BEGIN
  SELECT * INTO v_ride FROM mtaxi_rides WHERE id = p_ride_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Ride not found'); END IF;

  IF p_status = 'arrived' AND v_ride.status != 'accepted' THEN
    RETURN jsonb_build_object('error', 'Must be accepted before arrived');
  END IF;
  IF p_status = 'started' AND v_ride.status != 'arrived' THEN
    RETURN jsonb_build_object('error', 'Must be arrived before started');
  END IF;
  IF p_status = 'completed' AND v_ride.status != 'started' THEN
    RETURN jsonb_build_object('error', 'Must be started before completed');
  END IF;

  UPDATE mtaxi_rides SET
    status = p_status,
    arrived_at = CASE WHEN p_status = 'arrived' THEN now() ELSE arrived_at END,
    started_at = CASE WHEN p_status = 'started' THEN now() ELSE started_at END,
    completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = p_ride_id;

  RETURN jsonb_build_object('success', true, 'ride_id', p_ride_id, 'status', p_status);
END;
$$;

-- 7. Update treasury function to move from hold to actual on completion
CREATE OR REPLACE FUNCTION public.process_ride_treasury(ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride record;
  v_user_wallet record;
  v_mtaa_wallet uuid;
  v_gov_wallet uuid;
  v_driver_wallet uuid;
  v_total numeric;
  v_mtaa_fee numeric;
  v_gov_tax numeric;
  v_driver_earnings numeric;
BEGIN
  SELECT * INTO v_ride FROM mtaxi_rides WHERE id = ride_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Ride not found'); END IF;
  IF v_ride.treasury_split_at IS NOT NULL THEN RETURN jsonb_build_object('error', 'Already processed'); END IF;
  IF v_ride.status != 'completed' THEN RETURN jsonb_build_object('error', 'Ride not completed'); END IF;

  SELECT id INTO v_mtaa_wallet FROM wallet_accounts WHERE account_type = 'mtaa_treasury' AND currency = 'KES' LIMIT 1;
  SELECT id INTO v_gov_wallet FROM wallet_accounts WHERE account_type = 'gov_treasury' AND currency = 'KES' LIMIT 1;
  SELECT id INTO v_driver_wallet FROM wallet_accounts WHERE user_id = v_ride.driver_id AND currency = 'KES' LIMIT 1;
  SELECT id, balance, available_balance, hold_balance INTO v_user_wallet FROM wallet_accounts
  WHERE user_id = v_ride.passenger_id AND currency = 'KES' ORDER BY is_default DESC LIMIT 1;

  v_total := COALESCE(v_ride.fare_estimate, 0);
  IF v_total <= 0 THEN RETURN jsonb_build_object('error', 'Invalid fare'); END IF;

  v_mtaa_fee := ROUND(v_total * (COALESCE(v_ride.mtaa_fee_percent, 3) / 100), 2);
  v_gov_tax := ROUND(v_total * (COALESCE(v_ride.gov_tax_percent, 17.5) / 100), 2);
  v_driver_earnings := v_total - v_mtaa_fee - v_gov_tax;

  -- Release hold + deduct actual from balance
  IF v_user_wallet.id IS NOT NULL THEN
    UPDATE wallet_accounts SET
      balance = balance - v_total,
      hold_balance = hold_balance - v_total,
      updated_at = now()
    WHERE id = v_user_wallet.id AND hold_balance >= v_total;
    IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Hold balance insufficient'); END IF;

    INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, currency, status, description, reference_id, reference_type, metadata)
    VALUES (v_ride.passenger_id, v_user_wallet.id, 'debit', v_total, 'KES', 'completed',
      'Ride payment: ' || COALESCE(v_ride.pickup_address, 'Pickup') || ' to ' || COALESCE(v_ride.dropoff_address, 'Dropoff'),
      ride_id, 'mtaxi_ride', jsonb_build_object('direction', 'out', 'fare_total', v_total));
  END IF;

  IF v_mtaa_wallet IS NOT NULL THEN
    UPDATE wallet_accounts SET balance = balance + v_mtaa_fee, available_balance = available_balance + v_mtaa_fee, updated_at = now() WHERE id = v_mtaa_wallet;
    INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, currency, status, description, reference_id, reference_type, metadata)
    VALUES (NULL, v_mtaa_wallet, 'credit', v_mtaa_fee, 'KES', 'completed', 'MTAA platform fee (3%) - Ride ' || ride_id, ride_id, 'mtaa_fee', jsonb_build_object('direction', 'in', 'percent', 3));
  END IF;

  IF v_gov_wallet IS NOT NULL THEN
    UPDATE wallet_accounts SET balance = balance + v_gov_tax, available_balance = available_balance + v_gov_tax, updated_at = now() WHERE id = v_gov_wallet;
    INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, currency, status, description, reference_id, reference_type, metadata)
    VALUES (NULL, v_gov_wallet, 'credit', v_gov_tax, 'KES', 'completed', 'Gov tax (16% VAT + 1.5% DST) - Ride ' || ride_id, ride_id, 'gov_tax', jsonb_build_object('direction', 'in', 'vat_percent', 16, 'dst_percent', 1.5));
  END IF;

  IF v_driver_wallet IS NOT NULL AND v_ride.driver_id IS NOT NULL THEN
    UPDATE wallet_accounts SET balance = balance + v_driver_earnings, available_balance = available_balance + v_driver_earnings, updated_at = now() WHERE id = v_driver_wallet;
    INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, currency, status, description, reference_id, reference_type, metadata)
    VALUES (v_ride.driver_id, v_driver_wallet, 'credit', v_driver_earnings, 'KES', 'completed', 'Trip earnings (79.5%)', ride_id, 'driver_earnings', jsonb_build_object('direction', 'in', 'percent_of_fare', 79.5));
  END IF;

  UPDATE mtaxi_rides SET fare_total = v_total, mtaa_fee = v_mtaa_fee, gov_tax = v_gov_tax, driver_earnings = v_driver_earnings, treasury_split_at = now(), updated_at = now() WHERE id = ride_id;
  RETURN jsonb_build_object('success', true, 'ride_id', ride_id, 'fare_total', v_total, 'mtaa_fee', v_mtaa_fee, 'gov_tax', v_gov_tax, 'driver_earnings', v_driver_earnings, 'driver_percent', ROUND((v_driver_earnings/v_total)*100,1));
END;
$$;

-- 8. Update driver online status + location
CREATE OR REPLACE FUNCTION public.update_driver_status(p_driver_id uuid, p_is_online boolean, p_lat numeric DEFAULT NULL, p_lng numeric DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mtaxi_drivers SET
    is_online = p_is_online,
    current_lat = COALESCE(p_lat, current_lat),
    current_lng = COALESCE(p_lng, current_lng),
    location_updated_at = now(),
    updated_at = now()
  WHERE id = p_driver_id;
  RETURN jsonb_build_object('success', true, 'driver_id', p_driver_id, 'is_online', p_is_online);
END;
$$;

-- 9. In-app notification helper
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    data jsonb DEFAULT '{}',
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_title text, p_body text, p_data jsonb DEFAULT '{}')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notif record;
BEGIN
  INSERT INTO in_app_notifications (user_id, title, body, data) VALUES (p_user_id, p_title, p_body, p_data) RETURNING * INTO v_notif;
  RETURN jsonb_build_object('success', true, 'notification_id', v_notif.id);
END;
$$;
