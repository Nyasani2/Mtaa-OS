-- ============================================
-- MTAA Health OS: Edge Functions
-- Facility Onboarding + POS + QR + Inventory
-- ============================================

-- =====================================================
-- EDGE FUNCTION 1: register-facility
-- POST /functions/v1/register-facility
-- Body: { name, type, ownership, level, country, county, town, address, 
--         phone, email, bed_capacity, specialties[], services[], 
--         founder_name, founder_id_number, founder_phone, founder_email,
--         license_number, license_body }
-- =====================================================

CREATE OR REPLACE FUNCTION register_health_facility(
  p_name TEXT,
  p_type TEXT,
  p_ownership TEXT,
  p_level INTEGER,
  p_country TEXT,
  p_county TEXT,
  p_town TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_bed_capacity INTEGER,
  p_specialties TEXT[],
  p_services TEXT[],
  p_founder_name TEXT,
  p_founder_id_number TEXT,
  p_founder_phone TEXT,
  p_founder_email TEXT,
  p_license_number TEXT,
  p_license_body TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_founder_id UUID := auth.uid();
  v_registration_id UUID;
  v_result JSONB;
BEGIN
  -- Validate founder is authenticated
  IF v_founder_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Validate required fields
  IF p_name IS NULL OR p_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Facility name is required');
  END IF;

  IF p_phone IS NULL OR p_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phone number is required');
  END IF;

  -- Insert registration
  INSERT INTO health_facility_registrations (
    name, type, ownership, level, country, county, town, address,
    phone, email, bed_capacity, specialties, services,
    founder_user_id, founder_name, founder_id_number, founder_phone, founder_email,
    license_number, license_body, status, submitted_at
  ) VALUES (
    p_name, p_type, p_ownership, p_level, p_country, p_county, p_town, p_address,
    p_phone, p_email, p_bed_capacity, p_specialties, p_services,
    v_founder_id, p_founder_name, p_founder_id_number, p_founder_phone, p_founder_email,
    p_license_number, p_license_body, 'submitted', now()
  )
  RETURNING id INTO v_registration_id;

  -- Return success with registration ID
  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'message', 'Facility registration submitted successfully',
    'status', 'submitted',
    'next_steps', ARRAY[
      'Upload license documents',
      'Upload facility photos',
      'Wait for verification by Ministry of Health',
      'Verification typically takes 3-5 business days'
    ]
  );
END;
$$;

-- =====================================================
-- EDGE FUNCTION 2: verify-facility (Government only)
-- POST /functions/v1/verify-facility
-- Body: { registration_id, action ('verify'|'reject'|'suspend'), notes }
-- =====================================================

CREATE OR REPLACE FUNCTION verify_health_facility(
  p_registration_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inspector_id UUID := auth.uid();
  v_registration RECORD;
  v_facility_id UUID;
  v_result JSONB;
BEGIN
  -- Verify inspector authority
  IF NOT EXISTS (
    SELECT 1 FROM health_government_inspectors
    WHERE user_id = v_inspector_id
    AND status = 'active'
    AND can_verify_facilities = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Government inspector access required');
  END IF;

  -- Get registration
  SELECT * INTO v_registration FROM health_facility_registrations WHERE id = p_registration_id;

  IF v_registration IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registration not found');
  END IF;

  -- Process action
  IF p_action = 'verify' THEN
    -- Create the actual facility
    INSERT INTO health_facilities (
      name, type, ownership, level, county, town, address, phone, email,
      bed_capacity, specialties, services, license_number, license_body,
      verification_status, is_active, admin_user_id, country
    ) VALUES (
      v_registration.name, v_registration.type, v_registration.ownership,
      v_registration.level, v_registration.county, v_registration.town,
      v_registration.address, v_registration.phone, v_registration.email,
      v_registration.bed_capacity, v_registration.specialties, v_registration.services,
      v_registration.license_number, v_registration.license_body,
      'verified', true, v_registration.founder_user_id, v_registration.country
    )
    RETURNING id INTO v_facility_id;

    -- Update registration
    UPDATE health_facility_registrations
    SET status = 'verified', verified_at = now(), verified_by = v_inspector_id,
        verification_notes = p_notes
    WHERE id = p_registration_id;

    -- Add founder as admin
    INSERT INTO health_facility_admins (
      facility_id, user_id, admin_level, can_manage_staff, can_manage_inventory,
      can_manage_finance, can_manage_patients, can_view_reports, can_edit_settings,
      can_delete_data, status, appointed_by, appointed_at
    ) VALUES (
      v_facility_id, v_registration.founder_user_id, 'founder', true, true, true, true, true, true, true,
      'active', v_inspector_id, now()
    );

    -- Add founder to health_staff as hospital_admin
    INSERT INTO health_staff (
      user_id, facility_id, role, department, status, onboarding_status
    ) VALUES (
      v_registration.founder_user_id, v_facility_id, 'hospital_admin', 'Administration', 'active', 'approved'
    )
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
      'success', true,
      'facility_id', v_facility_id,
      'message', 'Facility verified and activated',
      'next_steps', ARRAY[
        'Login to Health OS',
        'Add staff members',
        'Set up inventory',
        'Configure operating hours'
      ]
    );

  ELSIF p_action = 'reject' THEN
    UPDATE health_facility_registrations
    SET status = 'rejected', rejection_reason = p_notes, verified_at = now(), verified_by = v_inspector_id
    WHERE id = p_registration_id;

    RETURN jsonb_build_object('success', true, 'message', 'Registration rejected', 'reason', p_notes);

  ELSIF p_action = 'suspend' THEN
    UPDATE health_facility_registrations
    SET status = 'suspended', verification_notes = p_notes, verified_by = v_inspector_id
    WHERE id = p_registration_id;

    -- Also suspend the facility if it exists
    UPDATE health_facilities
    SET is_active = false
    WHERE name = v_registration.name AND license_number = v_registration.license_number;

    RETURN jsonb_build_object('success', true, 'message', 'Facility suspended');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;

-- =====================================================
-- EDGE FUNCTION 3: generate-inventory-qr
-- Generates QR code data for inventory items
-- POST /functions/v1/generate-inventory-qr
-- Body: { inventory_id }
-- =====================================================

CREATE OR REPLACE FUNCTION generate_inventory_qr(
  p_inventory_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_inventory RECORD;
  v_qr_data TEXT;
  v_facility_id UUID;
BEGIN
  -- Get inventory with facility check
  SELECT i.*, hs.facility_id as user_facility_id
  INTO v_inventory
  FROM health_inventory i
  JOIN health_staff hs ON i.facility_id = hs.facility_id
  WHERE i.id = p_inventory_id
  AND hs.user_id = v_user_id
  AND hs.status = 'active';

  IF v_inventory IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inventory not found or unauthorized');
  END IF;

  -- Generate QR data string (JSON with essential info)
  v_qr_data := jsonb_build_object(
    'v', '1', -- version
    't', 'health_pos', -- type
    'f', v_inventory.facility_id,
    'i', v_inventory.id,
    'n', v_inventory.name,
    'p', v_inventory.selling_price,
    'b', v_inventory.batch_number,
    'e', v_inventory.expiry_date,
    's', v_inventory.sku,
    'ts', extract(epoch from now())
  )::text;

  -- Update inventory with QR data
  UPDATE health_inventory
  SET qr_code_data = v_qr_data, updated_at = now()
  WHERE id = p_inventory_id;

  RETURN jsonb_build_object(
    'success', true,
    'qr_data', v_qr_data,
    'inventory_id', p_inventory_id,
    'product_name', v_inventory.name,
    'price', v_inventory.selling_price
  );
END;
$$;

-- =====================================================
-- EDGE FUNCTION 4: process-pos-payment
-- Processes QR scan payment via MTAA Wallet
-- POST /functions/v1/process-pos-payment
-- Body: { qr_data, patient_id, quantity, payment_method }
-- =====================================================

CREATE OR REPLACE FUNCTION process_pos_payment(
  p_qr_data TEXT,
  p_patient_id UUID,
  p_quantity INTEGER DEFAULT 1,
  p_payment_method TEXT DEFAULT 'mtaa_wallet'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff_id UUID := auth.uid();
  v_qr_json JSONB;
  v_inventory_id UUID;
  v_facility_id UUID;
  v_inventory RECORD;
  v_transaction_id UUID;
  v_transaction_code TEXT;
  v_total_amount NUMERIC;
  v_wallet_balance NUMERIC;
  v_staff_record RECORD;
BEGIN
  -- Parse QR data
  BEGIN
    v_qr_json := p_qr_data::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid QR code');
  END;

  v_inventory_id := (v_qr_json->>'i')::uuid;
  v_facility_id := (v_qr_json->>'f')::uuid;

  -- Verify staff belongs to facility
  SELECT * INTO v_staff_record
  FROM health_staff
  WHERE user_id = v_staff_id
  AND facility_id = v_facility_id
  AND status = 'active'
  AND role IN ('pharmacist', 'cashier', 'hospital_admin', 'system_admin');

  IF v_staff_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Not a cashier/pharmacist at this facility');
  END IF;

  -- Get inventory
  SELECT * INTO v_inventory
  FROM health_inventory
  WHERE id = v_inventory_id
  AND facility_id = v_facility_id
  AND status = 'active';

  IF v_inventory IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  -- Check stock
  IF v_inventory.quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock', 'available', v_inventory.quantity);
  END IF;

  -- Check expiry
  IF v_inventory.expiry_date IS NOT NULL AND v_inventory.expiry_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product expired', 'expiry_date', v_inventory.expiry_date);
  END IF;

  -- Calculate total
  v_total_amount := v_inventory.selling_price * p_quantity;

  -- Check wallet balance if MTAA Wallet
  IF p_payment_method = 'mtaa_wallet' THEN
    -- This would check the wallet service - placeholder
    -- In production: SELECT balance INTO v_wallet_balance FROM wallet_accounts WHERE user_id = p_patient_id;
    v_wallet_balance := 999999; -- Placeholder - always sufficient for demo

    IF v_wallet_balance < v_total_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance', 'required', v_total_amount, 'available', v_wallet_balance);
    END IF;
  END IF;

  -- Generate transaction code
  v_transaction_code := 'POS-' || upper(split_part(v_facility_id::text, '-', 1)) || '-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 10000)::text;

  -- Create POS transaction
  INSERT INTO health_pos_transactions (
    facility_id, transaction_code, patient_id, items,
    subtotal, total_amount, payment_method, payment_status,
    qr_code_data, scanned_by, scanned_at, status
  ) VALUES (
    v_facility_id, v_transaction_code, p_patient_id,
    jsonb_build_array(jsonb_build_object(
      'inventory_id', v_inventory_id,
      'name', v_inventory.name,
      'quantity', p_quantity,
      'unit_price', v_inventory.selling_price,
      'total_price', v_total_amount,
      'batch_number', v_inventory.batch_number,
      'qr_scanned', true
    )),
    v_total_amount, v_total_amount, p_payment_method, 'completed',
    p_qr_data, v_staff_id, now(), 'dispensed'
  )
  RETURNING id INTO v_transaction_id;

  -- Deduct stock
  UPDATE health_inventory
  SET quantity = quantity - p_quantity,
      status = CASE WHEN quantity - p_quantity <= 0 THEN 'out_of_stock' ELSE status END,
      updated_at = now()
  WHERE id = v_inventory_id;

  -- Log inventory transaction
  INSERT INTO health_inventory_transactions (
    facility_id, inventory_id, transaction_type,
    quantity_before, quantity_change, quantity_after,
    patient_id, reason, performed_by, qr_scan_reference
  ) VALUES (
    v_facility_id, v_inventory_id, 'stock_out',
    v_inventory.quantity, -p_quantity, v_inventory.quantity - p_quantity,
    p_patient_id, 'POS sale: ' || v_transaction_code, v_staff_id, v_transaction_code
  );

  -- Update drug tracking
  UPDATE health_drug_tracking
  SET quantity_dispensed = quantity_dispensed + p_quantity
  WHERE inventory_id = v_inventory_id
  AND batch_number = v_inventory.batch_number;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'transaction_code', v_transaction_code,
    'product', v_inventory.name,
    'quantity', p_quantity,
    'total_amount', v_total_amount,
    'payment_method', p_payment_method,
    'remaining_stock', v_inventory.quantity - p_quantity,
    'message', 'Payment processed successfully'
  );
END;
$$;

-- =====================================================
-- EDGE FUNCTION 5: handle-facility-succession
-- Handles founder death/incapacitation
-- POST /functions/v1/handle-succession
-- Body: { facility_id, new_admin_id, reason, documents }
-- =====================================================

CREATE OR REPLACE FUNCTION handle_facility_succession(
  p_facility_id UUID,
  p_new_admin_id UUID,
  p_reason TEXT,
  p_succession_document_url TEXT DEFAULT NULL,
  p_court_order_url TEXT DEFAULT NULL,
  p_death_certificate_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requester_id UUID := auth.uid();
  v_facility RECORD;
  v_current_admin RECORD;
  v_new_user RECORD;
  v_succession_id UUID;
BEGIN
  -- Get facility
  SELECT * INTO v_facility FROM health_facilities WHERE id = p_facility_id;
  IF v_facility IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Facility not found');
  END IF;

  -- Get current founder/admin
  SELECT * INTO v_current_admin
  FROM health_facility_admins
  WHERE facility_id = p_facility_id AND admin_level = 'founder' AND status = 'active';

  -- Authorization check: must be current founder, government inspector, or court-appointed
  IF v_current_admin.user_id != v_requester_id THEN
    -- Check if requester is government inspector
    IF NOT EXISTS (
      SELECT 1 FROM health_government_inspectors
      WHERE user_id = v_requester_id
      AND status = 'active'
      AND can_verify_facilities = true
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only founder or government can initiate succession');
    END IF;
  END IF;

  -- Create succession record
  INSERT INTO health_facility_successions (
    facility_id, previous_admin_id, previous_admin_name, previous_admin_status,
    new_admin_id, new_admin_name, new_admin_relationship,
    succession_document_url, court_order_url, death_certificate_url,
    status
  ) VALUES (
    p_facility_id, v_current_admin.user_id, v_current_admin.name, 
    CASE WHEN p_death_certificate_url IS NOT NULL THEN 'deceased' ELSE 'incapacitated' END,
    p_new_admin_id, (SELECT display_name FROM user_profiles WHERE user_id = p_new_admin_id),
    'court_appointed',
    p_succession_document_url, p_court_order_url, p_death_certificate_url,
    'pending'
  )
  RETURNING id INTO v_succession_id;

  -- If government inspector is processing, auto-approve
  IF EXISTS (
    SELECT 1 FROM health_government_inspectors
    WHERE user_id = v_requester_id AND status = 'active' AND can_verify_facilities = true
  ) THEN
    -- Approve succession
    UPDATE health_facility_successions
    SET status = 'approved', approved_by = v_requester_id, approved_at = now()
    WHERE id = v_succession_id;

    -- Deactivate old admin
    UPDATE health_facility_admins
    SET status = 'removed', removed_at = now(), removed_reason = p_reason
    WHERE facility_id = p_facility_id AND user_id = v_current_admin.user_id;

    -- Activate new admin as founder
    INSERT INTO health_facility_admins (
      facility_id, user_id, admin_level, can_manage_staff, can_manage_inventory,
      can_manage_finance, can_manage_patients, can_view_reports, can_edit_settings,
      can_delete_data, status, appointed_by, appointed_at
    ) VALUES (
      p_facility_id, p_new_admin_id, 'founder', true, true, true, true, true, true, true,
      'active', v_requester_id, now()
    )
    ON CONFLICT (facility_id, user_id) DO UPDATE SET
      admin_level = 'founder', status = 'active', appointed_by = v_requester_id, appointed_at = now();

    -- Update facility admin
    UPDATE health_facilities
    SET admin_user_id = p_new_admin_id, updated_at = now()
    WHERE id = p_facility_id;

    RETURN jsonb_build_object(
      'success', true,
      'succession_id', v_succession_id,
      'message', 'Succession approved and processed',
      'new_admin_id', p_new_admin_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'succession_id', v_succession_id,
    'message', 'Succession request submitted. Awaiting government approval.',
    'status', 'pending'
  );
END;
$$;

-- =====================================================
-- EDGE FUNCTION 6: get-facility-dashboard-stats
-- Returns dashboard statistics for any facility
-- GET /functions/v1/facility-dashboard?facility_id=xxx
-- =====================================================

CREATE OR REPLACE FUNCTION get_facility_dashboard_stats(
  p_facility_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_stats JSONB;
BEGIN
  -- Verify access
  IF NOT EXISTS (
    SELECT 1 FROM health_staff
    WHERE facility_id = p_facility_id
    AND user_id = v_user_id
    AND status = 'active'
  ) AND NOT EXISTS (
    SELECT 1 FROM health_government_inspectors
    WHERE user_id = v_user_id AND status = 'active' AND can_view_all_records = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT jsonb_build_object(
    'facility_id', p_facility_id,
    'facility_name', (SELECT name FROM health_facilities WHERE id = p_facility_id),
    'total_staff', (SELECT COUNT(*) FROM health_staff WHERE facility_id = p_facility_id AND status = 'active'),
    'staff_on_duty', (SELECT COUNT(*) FROM health_staff WHERE facility_id = p_facility_id AND is_on_duty = true),
    'total_inventory_items', (SELECT COUNT(*) FROM health_inventory WHERE facility_id = p_facility_id),
    'low_stock_items', (SELECT COUNT(*) FROM health_inventory WHERE facility_id = p_facility_id AND quantity <= reorder_level),
    'expired_items', (SELECT COUNT(*) FROM health_inventory WHERE facility_id = p_facility_id AND expiry_date < CURRENT_DATE),
    'today_sales', COALESCE((SELECT SUM(total_amount) FROM health_pos_transactions WHERE facility_id = p_facility_id AND created_at >= CURRENT_DATE), 0),
    'today_transactions', (SELECT COUNT(*) FROM health_pos_transactions WHERE facility_id = p_facility_id AND created_at >= CURRENT_DATE),
    'pending_appointments', 0, -- Will link to appointments table
    'bed_occupancy', CASE 
      WHEN (SELECT bed_capacity FROM health_facilities WHERE id = p_facility_id) > 0 
      THEN ROUND((SELECT COUNT(*) FROM health_staff WHERE facility_id = p_facility_id)::numeric / 
           (SELECT bed_capacity FROM health_facilities WHERE id = p_facility_id) * 100, 1)
      ELSE 0 
    END
  ) INTO v_stats;

  RETURN jsonb_build_object('success', true, 'data', v_stats);
END;
$$;
