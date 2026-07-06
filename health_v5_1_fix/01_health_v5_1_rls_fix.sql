-- ============================================================
-- HEALTH OS V5.1: RLS + RPC FIX
-- Fixes: specialization column missing, facility_id policy errors
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Add missing columns to health_staff if they don't exist
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'health_staff' AND column_name = 'specialization') THEN
        ALTER TABLE health_staff ADD COLUMN specialization TEXT;
        COMMENT ON COLUMN health_staff.specialization IS 'Medical specialization (e.g., Cardiology, Pediatrics)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'health_staff' AND column_name = 'employment_type') THEN
        ALTER TABLE health_staff ADD COLUMN employment_type TEXT DEFAULT 'full_time';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'health_staff' AND column_name = 'shift_type') THEN
        ALTER TABLE health_staff ADD COLUMN shift_type TEXT DEFAULT 'day';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'health_staff' AND column_name = 'biometric_enabled') THEN
        ALTER TABLE health_staff ADD COLUMN biometric_enabled BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'health_staff' AND column_name = 'biometric_template') THEN
        ALTER TABLE health_staff ADD COLUMN biometric_template TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'health_staff' AND column_name = 'last_clock_in') THEN
        ALTER TABLE health_staff ADD COLUMN last_clock_in TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'health_staff' AND column_name = 'last_clock_out') THEN
        ALTER TABLE health_staff ADD COLUMN last_clock_out TIMESTAMPTZ;
    END IF;
END $$;

-- ============================================================
-- STEP 2: Drop ALL existing health RLS policies to start clean
-- ============================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'health_staff', 'health_facilities', 'health_departments', 
            'health_appointments', 'health_records', 'health_prescriptions',
            'health_pharmacy_inventory', 'health_lab_orders', 'health_billing',
            'health_insurance_claims', 'health_ambulance_dispatches',
            'health_shift_schedules', 'health_attendance', 'health_payroll',
            'health_staff_leave', 'health_notifications', 'health_analytics',
            'health_emergency_contacts', 'health_vitals', 'health_medications'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ============================================================
-- STEP 3: Enable RLS on all health tables
-- ============================================================

ALTER TABLE health_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_ambulance_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_staff_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_medications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create FIXED RLS Policies
-- Using role column (NOT specialization) for admin checks
-- ============================================================

-- health_staff: Users can see their own record. Admins can see all at their facility.
CREATE POLICY "health_staff_select_self" ON health_staff
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin')
      AND admin.facility_id = health_staff.facility_id
    )
  );

CREATE POLICY "health_staff_insert_self" ON health_staff
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "health_staff_update_self" ON health_staff
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'hr_manager')
      AND admin.facility_id = health_staff.facility_id
    )
  );

CREATE POLICY "health_staff_delete_admin" ON health_staff
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.role IN ('system_admin', 'facility_admin')
      AND admin.facility_id = health_staff.facility_id
    )
  );

-- health_facilities: Public view for approved, admin manage
CREATE POLICY "health_facilities_select_public" ON health_facilities
  FOR SELECT USING (status = 'approved' OR auth.uid() = created_by);

CREATE POLICY "health_facilities_insert_admin" ON health_facilities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.role IN ('system_admin', 'facility_admin', 'government_admin')
    )
  );

CREATE POLICY "health_facilities_update_admin" ON health_facilities
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'government_admin')
      AND admin.facility_id = health_facilities.id
    )
  );

-- health_departments
CREATE POLICY "health_departments_select" ON health_departments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_departments.facility_id
    ) OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin')
    )
  );

CREATE POLICY "health_departments_insert_admin" ON health_departments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin')
      AND admin.facility_id = health_departments.facility_id
    )
  );

-- health_appointments
CREATE POLICY "health_appointments_select" ON health_appointments
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.uid() = provider_id OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_appointments.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse')
    )
  );

CREATE POLICY "health_appointments_insert" ON health_appointments
  FOR INSERT WITH CHECK (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_appointments.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'receptionist', 'doctor')
    )
  );

CREATE POLICY "health_appointments_update" ON health_appointments
  FOR UPDATE USING (
    auth.uid() = patient_id OR
    auth.uid() = provider_id OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_appointments.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse')
    )
  );

-- health_records
CREATE POLICY "health_records_select" ON health_records
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_records.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "health_records_insert" ON health_records
  FOR INSERT WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_records.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'doctor', 'nurse')
    )
  );

-- health_prescriptions
CREATE POLICY "health_prescriptions_select" ON health_prescriptions
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.uid() = prescribed_by OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_prescriptions.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'doctor', 'pharmacist')
    )
  );

CREATE POLICY "health_prescriptions_insert" ON health_prescriptions
  FOR INSERT WITH CHECK (
    auth.uid() = prescribed_by OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_prescriptions.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'doctor')
    )
  );

-- health_pharmacy_inventory
CREATE POLICY "health_pharmacy_select" ON health_pharmacy_inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_pharmacy_inventory.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'pharmacist', 'pharmacy_manager')
    )
  );

CREATE POLICY "health_pharmacy_insert" ON health_pharmacy_inventory
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_pharmacy_inventory.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'pharmacy_manager')
    )
  );

CREATE POLICY "health_pharmacy_update" ON health_pharmacy_inventory
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_pharmacy_inventory.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'pharmacy_manager', 'pharmacist')
    )
  );

-- health_lab_orders
CREATE POLICY "health_lab_orders_select" ON health_lab_orders
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.uid() = ordered_by OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_lab_orders.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'doctor', 'lab_technician')
    )
  );

CREATE POLICY "health_lab_orders_insert" ON health_lab_orders
  FOR INSERT WITH CHECK (
    auth.uid() = ordered_by OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_lab_orders.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'doctor')
    )
  );

-- health_billing
CREATE POLICY "health_billing_select" ON health_billing
  FOR SELECT USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_billing.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'cashier', 'accountant')
    )
  );

CREATE POLICY "health_billing_insert" ON health_billing
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_billing.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'cashier', 'accountant')
    )
  );

-- health_insurance_claims
CREATE POLICY "health_insurance_select" ON health_insurance_claims
  FOR SELECT USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('system_admin', 'facility_admin', 'insurance_officer', 'accountant')
    )
  );

-- health_ambulance_dispatches
CREATE POLICY "health_ambulance_select" ON health_ambulance_dispatches
  FOR SELECT USING (
    auth.uid() = requested_by OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_ambulance_dispatches.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'ambulance_dispatcher', 'emergency_responder')
    )
  );

CREATE POLICY "health_ambulance_insert" ON health_ambulance_dispatches
  FOR INSERT WITH CHECK (
    auth.uid() = requested_by OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_ambulance_dispatches.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'ambulance_dispatcher', 'emergency_responder')
    )
  );

-- health_shift_schedules
CREATE POLICY "health_shifts_select" ON health_shift_schedules
  FOR SELECT USING (
    auth.uid() = staff_id OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.facility_id = health_shift_schedules.facility_id
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'hr_manager')
    )
  );

CREATE POLICY "health_shifts_insert" ON health_shift_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.facility_id = health_shift_schedules.facility_id
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'hr_manager')
    )
  );

-- health_attendance
CREATE POLICY "health_attendance_select" ON health_attendance
  FOR SELECT USING (
    auth.uid() = staff_id OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.facility_id = health_attendance.facility_id
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'hr_manager')
    )
  );

CREATE POLICY "health_attendance_insert" ON health_attendance
  FOR INSERT WITH CHECK (
    auth.uid() = staff_id OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.facility_id = health_attendance.facility_id
      AND admin.role IN ('system_admin', 'facility_admin', 'hr_manager')
    )
  );

-- health_payroll
CREATE POLICY "health_payroll_select" ON health_payroll
  FOR SELECT USING (
    auth.uid() = staff_id OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.facility_id = health_payroll.facility_id
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'accountant', 'hr_manager')
    )
  );

CREATE POLICY "health_payroll_insert" ON health_payroll
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.facility_id = health_payroll.facility_id
      AND admin.role IN ('system_admin', 'facility_admin', 'accountant', 'hr_manager')
    )
  );

-- health_staff_leave
CREATE POLICY "health_leave_select" ON health_staff_leave
  FOR SELECT USING (
    auth.uid() = staff_id OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.facility_id = health_staff_leave.facility_id
      AND admin.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'hr_manager')
    )
  );

CREATE POLICY "health_leave_insert" ON health_staff_leave
  FOR INSERT WITH CHECK (
    auth.uid() = staff_id OR
    EXISTS (
      SELECT 1 FROM health_staff admin
      WHERE admin.user_id = auth.uid()
      AND admin.facility_id = health_staff_leave.facility_id
      AND admin.role IN ('system_admin', 'facility_admin', 'hr_manager')
    )
  );

-- health_notifications
CREATE POLICY "health_notifications_select" ON health_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "health_notifications_insert" ON health_notifications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('system_admin', 'facility_admin')
    )
  );

CREATE POLICY "health_notifications_update" ON health_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "health_notifications_delete" ON health_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- health_analytics
CREATE POLICY "health_analytics_select" ON health_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_analytics.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'data_analyst')
    )
  );

-- health_emergency_contacts
CREATE POLICY "health_emergency_select" ON health_emergency_contacts
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('system_admin', 'emergency_responder', 'ambulance_dispatcher')
    )
  );

CREATE POLICY "health_emergency_insert" ON health_emergency_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "health_emergency_update" ON health_emergency_contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "health_emergency_delete" ON health_emergency_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- health_vitals
CREATE POLICY "health_vitals_select" ON health_vitals
  FOR SELECT USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_vitals.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "health_vitals_insert" ON health_vitals
  FOR INSERT WITH CHECK (
    auth.uid() = recorded_by OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_vitals.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'doctor', 'nurse')
    )
  );

-- health_medications
CREATE POLICY "health_medications_select" ON health_medications
  FOR SELECT USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_medications.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'hospital_admin', 'doctor', 'pharmacist', 'nurse')
    )
  );

CREATE POLICY "health_medications_insert" ON health_medications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_staff staff
      WHERE staff.user_id = auth.uid()
      AND staff.facility_id = health_medications.facility_id
      AND staff.role IN ('system_admin', 'facility_admin', 'doctor', 'pharmacist')
    )
  );

-- ============================================================
-- STEP 5: Fix the RPC function to handle system_admin correctly
-- ============================================================

CREATE OR REPLACE FUNCTION health_get_primary_staff_record(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  facility_id UUID,
  role TEXT,
  department TEXT,
  license_number TEXT,
  verified BOOLEAN,
  specialization TEXT,
  employment_type TEXT,
  shift_type TEXT,
  biometric_enabled BOOLEAN,
  last_clock_in TIMESTAMPTZ,
  last_clock_out TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.id,
    hs.user_id,
    hs.facility_id,
    hs.role,
    hs.department,
    hs.license_number,
    hs.verified,
    hs.specialization,
    hs.employment_type,
    hs.shift_type,
    hs.biometric_enabled,
    hs.last_clock_in,
    hs.last_clock_out
  FROM health_staff hs
  WHERE hs.user_id = p_user_id
  ORDER BY 
    CASE hs.role
      WHEN 'system_admin' THEN 1
      WHEN 'facility_admin' THEN 2
      WHEN 'hospital_admin' THEN 3
      WHEN 'doctor' THEN 4
      WHEN 'nurse' THEN 5
      WHEN 'pharmacist' THEN 6
      WHEN 'lab_technician' THEN 7
      WHEN 'radiologist' THEN 8
      WHEN 'receptionist' THEN 9
      WHEN 'cashier' THEN 10
      WHEN 'accountant' THEN 11
      WHEN 'hr_manager' THEN 12
      WHEN 'ambulance_dispatcher' THEN 13
      WHEN 'emergency_responder' THEN 14
      WHEN 'insurance_officer' THEN 15
      WHEN 'pharmacy_manager' THEN 16
      WHEN 'data_analyst' THEN 17
      ELSE 99
    END,
    hs.created_at DESC
  LIMIT 1;
END;
$$;

-- ============================================================
-- STEP 6: Create helper function to get ALL user roles
-- ============================================================

CREATE OR REPLACE FUNCTION health_get_all_user_roles(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  facility_id UUID,
  role TEXT,
  department TEXT,
  facility_name TEXT,
  verified BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.id,
    hs.facility_id,
    hs.role,
    hs.department,
    hf.name as facility_name,
    hs.verified
  FROM health_staff hs
  LEFT JOIN health_facilities hf ON hf.id = hs.facility_id
  WHERE hs.user_id = p_user_id
  ORDER BY hs.created_at DESC;
END;
$$;

-- ============================================================
-- STEP 7: Create clock-in/clock-out functions
-- ============================================================

CREATE OR REPLACE FUNCTION health_clock_in(
  p_user_id UUID,
  p_facility_id UUID,
  p_method TEXT DEFAULT 'manual'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_staff_id UUID;
  v_record_id UUID;
BEGIN
  -- Find staff record
  SELECT id INTO v_staff_id
  FROM health_staff
  WHERE user_id = p_user_id AND facility_id = p_facility_id
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Staff record not found');
  END IF;

  -- Update staff last_clock_in
  UPDATE health_staff 
  SET last_clock_in = NOW()
  WHERE id = v_staff_id;

  -- Create attendance record
  INSERT INTO health_attendance (staff_id, facility_id, clock_in, clock_in_method, status)
  VALUES (v_staff_id, p_facility_id, NOW(), p_method, 'active')
  RETURNING id INTO v_record_id;

  RETURN jsonb_build_object(
    'success', true,
    'record_id', v_record_id,
    'clock_in', NOW(),
    'staff_id', v_staff_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION health_clock_out(
  p_user_id UUID,
  p_facility_id UUID,
  p_method TEXT DEFAULT 'manual'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_staff_id UUID;
  v_record_id UUID;
  v_clock_in TIMESTAMPTZ;
  v_hours NUMERIC;
BEGIN
  -- Find staff record
  SELECT id INTO v_staff_id
  FROM health_staff
  WHERE user_id = p_user_id AND facility_id = p_facility_id
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Staff record not found');
  END IF;

  -- Find active attendance record
  SELECT id, clock_in INTO v_record_id, v_clock_in
  FROM health_attendance
  WHERE staff_id = v_staff_id AND facility_id = p_facility_id AND status = 'active'
  ORDER BY clock_in DESC
  LIMIT 1;

  IF v_record_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active clock-in found');
  END IF;

  -- Calculate hours
  v_hours := EXTRACT(EPOCH FROM (NOW() - v_clock_in)) / 3600;

  -- Update attendance record
  UPDATE health_attendance
  SET clock_out = NOW(),
      clock_out_method = p_method,
      hours_worked = v_hours,
      status = 'completed'
  WHERE id = v_record_id;

  -- Update staff last_clock_out
  UPDATE health_staff 
  SET last_clock_out = NOW()
  WHERE id = v_staff_id;

  RETURN jsonb_build_object(
    'success', true,
    'record_id', v_record_id,
    'clock_out', NOW(),
    'hours_worked', ROUND(v_hours, 2),
    'staff_id', v_staff_id
  );
END;
$$;

-- ============================================================
-- STEP 8: Grant execute permissions
-- ============================================================

GRANT EXECUTE ON FUNCTION health_get_primary_staff_record(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION health_get_primary_staff_record(UUID) TO anon;
GRANT EXECUTE ON FUNCTION health_get_all_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION health_get_all_user_roles(UUID) TO anon;
GRANT EXECUTE ON FUNCTION health_clock_in(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION health_clock_out(UUID, UUID, TEXT) TO authenticated;

-- ============================================================
-- STEP 9: Update existing staff records to have role populated
-- (if any have NULL role, set to 'doctor' as default)
-- ============================================================

UPDATE health_staff SET role = 'doctor' WHERE role IS NULL OR role = '';

-- ============================================================
-- DONE: All RLS policies now use 'role' column correctly
-- The 'specialization' column has been added for future use
-- but policies do NOT depend on it
-- ============================================================
