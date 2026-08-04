-- ============================================================
-- MTAA TRANSPORT TREASURY V3 — REAL WORLD RATES
-- MTAA fee: 3%  |  Gov tax: 17.5% (16% VAT + 1.5% Digital Service Tax)
-- ============================================================

-- 1. Add treasury columns to mtaxi_rides
ALTER TABLE mtaxi_rides
ADD COLUMN IF NOT EXISTS fare_total numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS mtaa_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS gov_tax numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS driver_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS treasury_split_at timestamptz,
ADD COLUMN IF NOT EXISTS mtaa_fee_percent numeric DEFAULT 3,     -- MTAA platform fee
ADD COLUMN IF NOT EXISTS gov_tax_percent numeric DEFAULT 17.5,   -- 16% VAT + 1.5% DST
ADD COLUMN IF NOT EXISTS base_fare numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_fare numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS surge_multiplier numeric DEFAULT 1;

-- 2. Create missing MTruck tables
CREATE TABLE IF NOT EXISTS mtruck_companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    company_name text NOT NULL,
    registration_number text,
    kra_pin text,
    email text NOT NULL,
    phone text,
    address_line1 text,
    city text,
    county text,
    country text DEFAULT 'Kenya',
    lat numeric,
    lng numeric,
    fleet_size integer DEFAULT 0,
    status text DEFAULT 'pending',
    verified_at timestamptz,
    verified_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mtruck_hauls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_id uuid NOT NULL,
    company_id uuid REFERENCES mtruck_companies(id),
    truck_id uuid REFERENCES mtruck_trucks(id),
    pickup_lat numeric NOT NULL,
    pickup_lng numeric NOT NULL,
    dropoff_lat numeric NOT NULL,
    dropoff_lng numeric NOT NULL,
    pickup_address text,
    dropoff_address text,
    cargo_type text,
    weight_kg numeric,
    status text DEFAULT 'pending',
    fare_estimate numeric,
    final_fare numeric,
    base_fare numeric DEFAULT 0,
    distance_fare numeric DEFAULT 0,
    time_fare numeric DEFAULT 0,
    surge_multiplier numeric DEFAULT 1,
    payment_method text DEFAULT 'wallet',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create missing Garage tables
CREATE TABLE IF NOT EXISTS garage_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    garage_id uuid REFERENCES garages(id) ON DELETE CASCADE,
    device_name text NOT NULL,
    device_type text NOT NULL,
    serial_number text,
    status text DEFAULT 'active',
    last_synced_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS garage_recordings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    garage_id uuid REFERENCES garages(id) ON DELETE CASCADE,
    device_id uuid REFERENCES garage_devices(id),
    recording_url text NOT NULL,
    incident_type text DEFAULT 'general',
    status text DEFAULT 'active',
    recorded_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS garage_incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    garage_id uuid REFERENCES garages(id) ON DELETE CASCADE,
    recording_id uuid REFERENCES garage_recordings(id),
    vehicle_plate text,
    description text,
    severity text DEFAULT 'low',
    status text DEFAULT 'open',
    reported_by uuid,
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS garage_inspections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    garage_id uuid REFERENCES garages(id) ON DELETE CASCADE,
    vehicle_id uuid REFERENCES mtaxi_vehicles(id),
    inspector_id uuid,
    inspection_type text DEFAULT 'routine',
    result text DEFAULT 'pending',
    notes text,
    inspected_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Treasury wallets (one-time setup)
INSERT INTO wallet_accounts (user_id, account_type, currency, balance, available_balance, status, is_default)
VALUES (NULL, 'mtaa_treasury', 'KES', 0, 0, 'active', false)
ON CONFLICT DO NOTHING;

INSERT INTO wallet_accounts (user_id, account_type, currency, balance, available_balance, status, is_default)
VALUES (NULL, 'gov_treasury', 'KES', 0, 0, 'active', false)
ON CONFLICT DO NOTHING;

-- 5. Treasury routing function — REAL WORLD SPLIT
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
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Ride not found');
  END IF;

  IF v_ride.treasury_split_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Already processed', 'ride_id', ride_id);
  END IF;

  SELECT id INTO v_mtaa_wallet FROM wallet_accounts 
  WHERE account_type = 'mtaa_treasury' AND currency = 'KES' LIMIT 1;

  SELECT id INTO v_gov_wallet FROM wallet_accounts 
  WHERE account_type = 'gov_treasury' AND currency = 'KES' LIMIT 1;

  SELECT id INTO v_driver_wallet FROM wallet_accounts 
  WHERE user_id = v_ride.driver_id AND currency = 'KES' LIMIT 1;

  SELECT id, available_balance INTO v_user_wallet FROM wallet_accounts 
  WHERE user_id = v_ride.passenger_id AND currency = 'KES'
  ORDER BY is_default DESC LIMIT 1;

  v_total := COALESCE(v_ride.fare_estimate, 0);
  IF v_total <= 0 THEN
    RETURN jsonb_build_object('error', 'Invalid fare', 'fare', v_total);
  END IF;

  -- MTAA: 3% platform fee
  v_mtaa_fee := ROUND(v_total * (COALESCE(v_ride.mtaa_fee_percent, 3) / 100), 2);
  -- GOV: 17.5% (16% VAT + 1.5% Digital Service Tax)
  v_gov_tax := ROUND(v_total * (COALESCE(v_ride.gov_tax_percent, 17.5) / 100), 2);
  -- Driver gets the rest
  v_driver_earnings := v_total - v_mtaa_fee - v_gov_tax;

  -- 1. Deduct from passenger wallet (check available_balance)
  IF v_user_wallet.id IS NOT NULL THEN
    UPDATE wallet_accounts 
    SET balance = balance - v_total,
        available_balance = available_balance - v_total,
        updated_at = now()
    WHERE id = v_user_wallet.id AND available_balance >= v_total;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Insufficient user balance');
    END IF;

    INSERT INTO wallet_transactions (
      user_id, wallet_id, type, amount, currency, status, description,
      reference_id, reference_type, metadata
    ) VALUES (
      v_ride.passenger_id, v_user_wallet.id, 'debit', v_total, 'KES', 'completed',
      'Ride payment: ' || COALESCE(v_ride.pickup_address, 'Pickup') || ' to ' || COALESCE(v_ride.dropoff_address, 'Dropoff'),
      ride_id, 'mtaxi_ride', jsonb_build_object('direction', 'out', 'fare_total', v_total)
    );
  END IF;

  -- 2. Credit MTAA treasury (3%)
  IF v_mtaa_wallet IS NOT NULL THEN
    UPDATE wallet_accounts 
    SET balance = balance + v_mtaa_fee,
        available_balance = available_balance + v_mtaa_fee,
        updated_at = now()
    WHERE id = v_mtaa_wallet;

    INSERT INTO wallet_transactions (
      user_id, wallet_id, type, amount, currency, status, description,
      reference_id, reference_type, metadata
    ) VALUES (
      NULL, v_mtaa_wallet, 'credit', v_mtaa_fee, 'KES', 'completed',
      'MTAA platform fee (3%) - Ride ' || ride_id,
      ride_id, 'mtaa_fee', jsonb_build_object('direction', 'in', 'percent', 3)
    );
  END IF;

  -- 3. Credit GOVERNMENT treasury (17.5%)
  IF v_gov_wallet IS NOT NULL THEN
    UPDATE wallet_accounts 
    SET balance = balance + v_gov_tax,
        available_balance = available_balance + v_gov_tax,
        updated_at = now()
    WHERE id = v_gov_wallet;

    INSERT INTO wallet_transactions (
      user_id, wallet_id, type, amount, currency, status, description,
      reference_id, reference_type, metadata
    ) VALUES (
      NULL, v_gov_wallet, 'credit', v_gov_tax, 'KES', 'completed',
      'Gov tax (16% VAT + 1.5% DST) - Ride ' || ride_id,
      ride_id, 'gov_tax', jsonb_build_object('direction', 'in', 'vat_percent', 16, 'dst_percent', 1.5)
    );
  END IF;

  -- 4. Credit DRIVER earnings (79.5%)
  IF v_driver_wallet IS NOT NULL AND v_ride.driver_id IS NOT NULL THEN
    UPDATE wallet_accounts 
    SET balance = balance + v_driver_earnings,
        available_balance = available_balance + v_driver_earnings,
        updated_at = now()
    WHERE id = v_driver_wallet;

    INSERT INTO wallet_transactions (
      user_id, wallet_id, type, amount, currency, status, description,
      reference_id, reference_type, metadata
    ) VALUES (
      v_ride.driver_id, v_driver_wallet, 'credit', v_driver_earnings, 'KES', 'completed',
      'Trip earnings (79.5%)',
      ride_id, 'driver_earnings', jsonb_build_object('direction', 'in', 'percent_of_fare', 79.5)
    );
  END IF;

  -- 5. Update ride with split details
  UPDATE mtaxi_rides SET
    fare_total = v_total,
    mtaa_fee = v_mtaa_fee,
    gov_tax = v_gov_tax,
    driver_earnings = v_driver_earnings,
    treasury_split_at = now(),
    updated_at = now()
  WHERE id = ride_id;

  RETURN jsonb_build_object(
    'success', true,
    'ride_id', ride_id,
    'fare_total', v_total,
    'mtaa_fee', v_mtaa_fee,
    'gov_tax', v_gov_tax,
    'driver_earnings', v_driver_earnings,
    'driver_percent', ROUND((v_driver_earnings / v_total) * 100, 1)
  );
END;
$$;

-- 6. Auto-split trigger on ride completion
CREATE OR REPLACE FUNCTION public.auto_treasury_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM public.process_ride_treasury(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_treasury ON mtaxi_rides;
CREATE TRIGGER trg_auto_treasury
AFTER UPDATE OF status ON mtaxi_rides
FOR EACH ROW
EXECUTE FUNCTION public.auto_treasury_on_complete();
