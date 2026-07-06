-- ============================================================
-- Health OS Final Production SQL: Biometric Clock-In + New Tables
-- ============================================================

-- Drop existing functions with different signatures
DROP FUNCTION IF EXISTS health_staff_clock_in(uuid, uuid);
DROP FUNCTION IF EXISTS health_staff_clock_out(uuid);

-- Biometric Clock-In RPC
CREATE OR REPLACE FUNCTION health_staff_clock_in(
  p_staff_id UUID,
  p_facility_id UUID DEFAULT NULL,
  p_auth_method TEXT DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_attendance_id UUID;
BEGIN
  -- Get staff record
  SELECT * INTO v_record FROM health_staff WHERE id = p_staff_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Staff record not found');
  END IF;

  -- Check if already clocked in today
  SELECT id INTO v_attendance_id
  FROM health_attendance
  WHERE staff_id = p_staff_id
    AND date = CURRENT_DATE
    AND clock_out IS NULL;

  IF v_attendance_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already clocked in today');
  END IF;

  -- Create attendance record
  INSERT INTO health_attendance (staff_id, date, clock_in, status, auth_method)
  VALUES (p_staff_id, CURRENT_DATE, NOW(), 'present', p_auth_method)
  RETURNING id INTO v_attendance_id;

  -- Update staff on-duty status
  UPDATE health_staff SET is_on_duty = true WHERE id = p_staff_id;

  RETURN jsonb_build_object('success', true, 'attendance_id', v_attendance_id);
END;
$$;

-- Biometric Clock-Out RPC
CREATE OR REPLACE FUNCTION health_staff_clock_out(
  p_staff_id UUID,
  p_auth_method TEXT DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_hours NUMERIC;
BEGIN
  -- Get today's attendance record
  SELECT * INTO v_record
  FROM health_attendance
  WHERE staff_id = p_staff_id
    AND date = CURRENT_DATE
    AND clock_out IS NULL
  ORDER BY clock_in DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active clock-in found');
  END IF;

  -- Calculate hours worked
  v_hours := EXTRACT(EPOCH FROM (NOW() - v_record.clock_in)) / 3600;

  -- Update attendance record
  UPDATE health_attendance
  SET clock_out = NOW(),
      hours_worked = v_hours,
      auth_method = p_auth_method
  WHERE id = v_record.id;

  -- Update staff on-duty status
  UPDATE health_staff SET is_on_duty = false WHERE id = p_staff_id;

  RETURN jsonb_build_object('success', true, 'hours_worked', v_hours);
END;
$$;

-- ============================================================
-- New Tables for Health OS Production
-- ============================================================

-- Health Attendance (if not exists)
CREATE TABLE IF NOT EXISTS health_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES health_staff(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  hours_worked NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'on_leave', 'half_day')),
  notes TEXT,
  auth_method TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- Health Shifts
CREATE TABLE IF NOT EXISTS health_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES health_staff(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night', 'on_call', 'weekend')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'swapped')),
  department TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Leave Requests
CREATE TABLE IF NOT EXISTS health_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES health_staff(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'maternity', 'paternity', 'compassionate', 'unpaid', 'study')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Payroll
CREATE TABLE IF NOT EXISTS health_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES health_staff(id) ON DELETE CASCADE,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  overtime_rate NUMERIC(12,2) DEFAULT 0,
  bonus NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  net_pay NUMERIC(12,2) GENERATED ALWAYS AS (base_salary + (overtime_hours * overtime_rate) + bonus - deductions - tax) STORED,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid', 'rejected')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Budget
CREATE TABLE IF NOT EXISTS health_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES health_facilities(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('salaries', 'medical_supplies', 'equipment', 'utilities', 'maintenance', 'pharmaceuticals', 'insurance', 'marketing', 'other')),
  allocated_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent_amount NUMERIC(12,2) DEFAULT 0,
  fiscal_year INTEGER NOT NULL,
  fiscal_quarter INTEGER NOT NULL CHECK (fiscal_quarter BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exceeded', 'closed', 'draft')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Revenue
CREATE TABLE IF NOT EXISTS health_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES health_facilities(id) ON DELETE SET NULL,
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL CHECK (source IN ('consultation', 'pharmacy', 'lab', 'radiology', 'surgery', 'admission', 'insurance', 'other')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'insurance', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'refunded', 'cancelled')),
  patient_id UUID,
  patient_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Procurement
CREATE TABLE IF NOT EXISTS health_procurement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES health_facilities(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medical_equipment', 'pharmaceuticals', 'office_supplies', 'laboratory', 'surgical', 'it_equipment', 'furniture', 'other')),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  unit_cost NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'ordered', 'delivered', 'cancelled', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Tax Records
CREATE TABLE IF NOT EXISTS health_tax_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES health_facilities(id) ON DELETE SET NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('vat', 'income_tax', 'payroll_tax', 'property_tax', 'customs_duty', 'excise', 'other')),
  tax_period TEXT NOT NULL,
  taxable_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) GENERATED ALWAYS AS (taxable_amount * tax_rate / 100) STORED,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) GENERATED ALWAYS AS (taxable_amount * tax_rate / 100 - paid_amount) STORED,
  filing_date DATE,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filed', 'paid', 'overdue', 'waived')),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Compliance
CREATE TABLE IF NOT EXISTS health_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES health_facilities(id) ON DELETE SET NULL,
  regulation_name TEXT NOT NULL,
  regulation_body TEXT NOT NULL,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN ('licensing', 'accreditation', 'safety', 'privacy', 'environmental', 'labor', 'financial', 'clinical', 'other')),
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  renewal_reminder_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'renewed', 'suspended', 'pending')),
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Ambulance Vehicles
CREATE TABLE IF NOT EXISTS health_ambulance_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('basic_life_support', 'advanced_life_support', 'neonatal', 'patient_transport', 'air_ambulance')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'en_route', 'on_scene', 'at_hospital', 'maintenance', 'offline')),
  current_location TEXT,
  last_updated TIMESTAMPTZ,
  crew_count INTEGER DEFAULT 0,
  fuel_level NUMERIC(5,2),
  odometer NUMERIC(10,2),
  next_maintenance DATE,
  facility_id UUID REFERENCES health_facilities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Ambulance Dispatches
CREATE TABLE IF NOT EXISTS health_ambulance_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_code TEXT NOT NULL UNIQUE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  pickup_address TEXT NOT NULL,
  pickup_coordinates JSONB,
  destination_facility_id UUID REFERENCES health_facilities(id) ON DELETE SET NULL,
  emergency_type TEXT NOT NULL CHECK (emergency_type IN ('cardiac', 'trauma', 'respiratory', 'obstetric', 'pediatric', 'psychiatric', 'burn', 'poisoning', 'other')),
  priority TEXT NOT NULL DEFAULT 'urgent' CHECK (priority IN ('critical', 'urgent', 'routine')),
  status TEXT NOT NULL DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'en_route', 'on_scene', 'transporting', 'at_hospital', 'completed', 'cancelled')),
  assigned_vehicle_id UUID REFERENCES health_ambulance_vehicles(id) ON DELETE SET NULL,
  assigned_crew TEXT[],
  eta_minutes INTEGER,
  dispatch_time TIMESTAMPTZ DEFAULT NOW(),
  arrival_time TIMESTAMPTZ,
  completion_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Ambulance Logs
CREATE TABLE IF NOT EXISTS health_ambulance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID REFERENCES health_ambulance_dispatches(id) ON DELETE CASCADE,
  distance_km NUMERIC(8,2),
  duration_minutes INTEGER,
  fuel_used NUMERIC(6,2),
  crew_members TEXT[],
  patient_condition_start TEXT,
  patient_condition_end TEXT,
  equipment_used TEXT[],
  medications_administered TEXT[],
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Patients (for receptionist registration)
CREATE TABLE IF NOT EXISTS health_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  id_number TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  blood_type TEXT,
  allergies TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Check-Ins (for receptionist queue)
CREATE TABLE IF NOT EXISTS health_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('walk_in', 'appointment', 'emergency', 'follow_up', 'referral')),
  department TEXT NOT NULL,
  doctor_id UUID REFERENCES health_staff(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'emergency')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'completed', 'cancelled', 'no_show')),
  queue_number INTEGER,
  estimated_wait_minutes INTEGER,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Appointments (enhanced)
CREATE TABLE IF NOT EXISTS health_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID REFERENCES health_staff(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES health_facilities(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  type TEXT NOT NULL DEFAULT 'in_person' CHECK (type IN ('in_person', 'telemedicine', 'follow_up')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived')),
  consultation_fee NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE health_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_procurement ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_ambulance_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_ambulance_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_ambulance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - adjust per your needs)
CREATE POLICY "health_attendance_select" ON health_attendance FOR SELECT USING (true);
CREATE POLICY "health_attendance_insert" ON health_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "health_attendance_update" ON health_attendance FOR UPDATE USING (true);

CREATE POLICY "health_shifts_select" ON health_shifts FOR SELECT USING (true);
CREATE POLICY "health_shifts_insert" ON health_shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "health_shifts_update" ON health_shifts FOR UPDATE USING (true);

CREATE POLICY "health_leave_select" ON health_leave_requests FOR SELECT USING (true);
CREATE POLICY "health_leave_insert" ON health_leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "health_leave_update" ON health_leave_requests FOR UPDATE USING (true);

CREATE POLICY "health_payroll_select" ON health_payroll FOR SELECT USING (true);
CREATE POLICY "health_payroll_insert" ON health_payroll FOR INSERT WITH CHECK (true);
CREATE POLICY "health_payroll_update" ON health_payroll FOR UPDATE USING (true);

CREATE POLICY "health_budget_select" ON health_budget FOR SELECT USING (true);
CREATE POLICY "health_budget_insert" ON health_budget FOR INSERT WITH CHECK (true);
CREATE POLICY "health_budget_update" ON health_budget FOR UPDATE USING (true);

CREATE POLICY "health_revenue_select" ON health_revenue FOR SELECT USING (true);
CREATE POLICY "health_revenue_insert" ON health_revenue FOR INSERT WITH CHECK (true);
CREATE POLICY "health_revenue_update" ON health_revenue FOR UPDATE USING (true);

CREATE POLICY "health_procurement_select" ON health_procurement FOR SELECT USING (true);
CREATE POLICY "health_procurement_insert" ON health_procurement FOR INSERT WITH CHECK (true);
CREATE POLICY "health_procurement_update" ON health_procurement FOR UPDATE USING (true);

CREATE POLICY "health_tax_select" ON health_tax_records FOR SELECT USING (true);
CREATE POLICY "health_tax_insert" ON health_tax_records FOR INSERT WITH CHECK (true);
CREATE POLICY "health_tax_update" ON health_tax_records FOR UPDATE USING (true);

CREATE POLICY "health_compliance_select" ON health_compliance FOR SELECT USING (true);
CREATE POLICY "health_compliance_insert" ON health_compliance FOR INSERT WITH CHECK (true);
CREATE POLICY "health_compliance_update" ON health_compliance FOR UPDATE USING (true);

CREATE POLICY "health_vehicles_select" ON health_ambulance_vehicles FOR SELECT USING (true);
CREATE POLICY "health_vehicles_insert" ON health_ambulance_vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "health_vehicles_update" ON health_ambulance_vehicles FOR UPDATE USING (true);

CREATE POLICY "health_dispatches_select" ON health_ambulance_dispatches FOR SELECT USING (true);
CREATE POLICY "health_dispatches_insert" ON health_ambulance_dispatches FOR INSERT WITH CHECK (true);
CREATE POLICY "health_dispatches_update" ON health_ambulance_dispatches FOR UPDATE USING (true);

CREATE POLICY "health_logs_select" ON health_ambulance_logs FOR SELECT USING (true);
CREATE POLICY "health_logs_insert" ON health_ambulance_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "health_patients_select" ON health_patients FOR SELECT USING (true);
CREATE POLICY "health_patients_insert" ON health_patients FOR INSERT WITH CHECK (true);
CREATE POLICY "health_patients_update" ON health_patients FOR UPDATE USING (true);

CREATE POLICY "health_checkins_select" ON health_check_ins FOR SELECT USING (true);
CREATE POLICY "health_checkins_insert" ON health_check_ins FOR INSERT WITH CHECK (true);
CREATE POLICY "health_checkins_update" ON health_check_ins FOR UPDATE USING (true);

CREATE POLICY "health_appointments_select" ON health_appointments FOR SELECT USING (true);
CREATE POLICY "health_appointments_insert" ON health_appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "health_appointments_update" ON health_appointments FOR UPDATE USING (true);

-- Grant execute on RPCs
GRANT EXECUTE ON FUNCTION health_staff_clock_in(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION health_staff_clock_out(UUID, TEXT) TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_attendance_staff_date ON health_attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_health_shifts_staff ON health_shifts(staff_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_health_leave_staff ON health_leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_health_payroll_staff ON health_payroll(staff_id, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_health_revenue_date ON health_revenue(revenue_date);
CREATE INDEX IF NOT EXISTS idx_health_procurement_status ON health_procurement(status);
CREATE INDEX IF NOT EXISTS idx_health_tax_due ON health_tax_records(due_date);
CREATE INDEX IF NOT EXISTS idx_health_compliance_expiry ON health_compliance(expiry_date);
CREATE INDEX IF NOT EXISTS idx_health_dispatches_status ON health_ambulance_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_health_checkins_status ON health_check_ins(status);
CREATE INDEX IF NOT EXISTS idx_health_appointments_date ON health_appointments(appointment_date);
