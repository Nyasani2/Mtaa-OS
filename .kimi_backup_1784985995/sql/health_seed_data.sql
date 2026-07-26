-- ============================================
-- MTAA Health OS Seed Data — COMPLETE
-- User UUID: 8e41ee2e-ae74-43a5-a550-a1d02a5591a3
-- Run ENTIRE file in Supabase SQL Editor
-- ============================================

-- STEP 1: Create health_staff table
CREATE TABLE IF NOT EXISTS health_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES health_facilities(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN (
    'system_admin','doctor','nurse','pharmacist','lab_technician',
    'radiologist','hospital_admin','cashier','hr_manager',
    'accountant','ambulance_driver','receptionist'
  )),
  department TEXT, specialization TEXT, license_number TEXT,
  years_of_experience INTEGER DEFAULT 0, consultation_fee DECIMAL(10,2) DEFAULT 0,
  languages TEXT[] DEFAULT '{}', shift_preference TEXT,
  onboarding_status TEXT DEFAULT 'pending' CHECK (onboarding_status IN ('pending','approved','rejected')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','suspended','on_leave')),
  is_on_duty BOOLEAN DEFAULT false, clock_in_time TIMESTAMPTZ, clock_out_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, facility_id, role)
);
ALTER TABLE health_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users view own staff" ON health_staff FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "System admins view all staff" ON health_staff FOR SELECT USING (EXISTS (SELECT 1 FROM health_staff hs WHERE hs.user_id = auth.uid() AND hs.role = 'system_admin' AND hs.status = 'active'));
CREATE POLICY IF NOT EXISTS "Hospital admins view facility staff" ON health_staff FOR SELECT USING (EXISTS (SELECT 1 FROM health_staff hs WHERE hs.user_id = auth.uid() AND hs.role = 'hospital_admin' AND hs.status = 'active' AND hs.facility_id = health_staff.facility_id));

-- STEP 2: Create health_facilities table
CREATE TABLE IF NOT EXISTS health_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital','clinic','pharmacy','specialist','laboratory','diagnostic_center')),
  license_number TEXT, address TEXT, city TEXT, country TEXT DEFAULT 'Kenya',
  phone TEXT, email TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  is_active BOOLEAN DEFAULT true, admin_user_id UUID REFERENCES auth.users(id),
  latitude DECIMAL(10,8), longitude DECIMAL(11,8), created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE health_facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone view verified facilities" ON health_facilities FOR SELECT USING (verification_status = 'verified' OR is_active = true);
CREATE POLICY IF NOT EXISTS "System admins manage facilities" ON health_facilities FOR ALL USING (EXISTS (SELECT 1 FROM health_staff hs WHERE hs.user_id = auth.uid() AND hs.role = 'system_admin' AND hs.status = 'active'));

-- STEP 3: Create health_departments table
CREATE TABLE IF NOT EXISTS health_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, head_doctor_id UUID REFERENCES health_staff(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE health_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone view departments" ON health_departments FOR SELECT TO authenticated USING (true);

-- STEP 4: Create health_staff_invitations table
CREATE TABLE IF NOT EXISTS health_staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,
  email TEXT NOT NULL, role TEXT NOT NULL, department TEXT,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  created_at TIMESTAMPTZ DEFAULT now(), expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);
ALTER TABLE health_staff_invitations ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create health_attendance table
CREATE TABLE IF NOT EXISTS health_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES health_staff(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL, clock_out TIMESTAMPTZ, duration_minutes INTEGER, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE health_attendance ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create health_shifts table
CREATE TABLE IF NOT EXISTS health_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES health_staff(id) ON DELETE SET NULL,
  date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL,
  department TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE health_shifts ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create health_payroll table
CREATE TABLE IF NOT EXISTS health_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES health_staff(id) ON DELETE CASCADE,
  month TEXT NOT NULL, base_salary DECIMAL(12,2) NOT NULL,
  allowances DECIMAL(12,2) DEFAULT 0, deductions DECIMAL(12,2) DEFAULT 0,
  net_pay DECIMAL(12,2) GENERATED ALWAYS AS (base_salary + allowances - deductions) STORED,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processed','paid')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE health_payroll ENABLE ROW LEVEL SECURITY;

-- STEP 8: Seed 5 demo facilities
INSERT INTO health_facilities (name, type, license_number, address, city, country, phone, email, verification_status, is_active, latitude, longitude)
VALUES
  ('Kenyatta National Hospital', 'hospital', 'KNH-001', 'Hospital Road, Nairobi', 'Nairobi', 'Kenya', '+254 20 2726300', 'info@knh.or.ke', 'verified', true, -1.3012, 36.8072),
  ('Nairobi West Hospital', 'hospital', 'NWH-002', 'Gandhi Avenue, Nairobi West', 'Nairobi', 'Kenya', '+254 20 6006000', 'info@nairobiwesthospital.com', 'verified', true, -1.3075, 36.8254),
  ('Aga Khan University Hospital', 'hospital', 'AKUH-003', '3rd Parklands Avenue', 'Nairobi', 'Kenya', '+254 20 3662000', 'info@aku.edu', 'verified', true, -1.2613, 36.8172),
  ('Lancet Laboratories', 'laboratory', 'LAN-004', 'Ralph Bunche Road', 'Nairobi', 'Kenya', '+254 20 2712980', 'info@lancet.co.ke', 'verified', true, -1.2921, 36.8219),
  ('Haltons Pharmacy', 'pharmacy', 'HAL-005', 'Kimathi Street', 'Nairobi', 'Kenya', '+254 722 123456', 'info@haltons.co.ke', 'verified', true, -1.2833, 36.8167)
ON CONFLICT DO NOTHING;

-- STEP 9: Seed demo departments
INSERT INTO health_departments (facility_id, name, description)
SELECT id, 'General Medicine', 'Primary care and general consultations' FROM health_facilities WHERE name = 'Kenyatta National Hospital'
UNION ALL SELECT id, 'Cardiology', 'Heart and cardiovascular care' FROM health_facilities WHERE name = 'Kenyatta National Hospital'
UNION ALL SELECT id, 'Pediatrics', 'Children health services' FROM health_facilities WHERE name = 'Kenyatta National Hospital'
UNION ALL SELECT id, 'Laboratory', 'Diagnostic testing' FROM health_facilities WHERE name = 'Lancet Laboratories'
UNION ALL SELECT id, 'Pharmacy', 'Dispensary and medication' FROM health_facilities WHERE name = 'Haltons Pharmacy'
ON CONFLICT DO NOTHING;

-- STEP 10: Make YOU system_admin at KNH
INSERT INTO health_staff (user_id, facility_id, role, department, status, onboarding_status, is_on_duty)
VALUES (
  '8e41ee2e-ae74-43a5-a550-a1d02a5591a3'::uuid,
  (SELECT id FROM health_facilities WHERE name = 'Kenyatta National Hospital' LIMIT 1),
  'system_admin', 'Administration', 'active', 'approved', false
)
ON CONFLICT DO NOTHING;

-- STEP 11: Seed demo staff (all linked to your UUID for demo)
INSERT INTO health_staff (user_id, facility_id, role, department, specialization, status, onboarding_status, is_on_duty, years_of_experience, consultation_fee)
VALUES
  ('8e41ee2e-ae74-43a5-a550-a1d02a5591a3'::uuid, (SELECT id FROM health_facilities WHERE name = 'Kenyatta National Hospital' LIMIT 1), 'doctor', 'Cardiology', 'Interventional Cardiology', 'active', 'approved', true, 12, 5000),
  ('8e41ee2e-ae74-43a5-a550-a1d02a5591a3'::uuid, (SELECT id FROM health_facilities WHERE name = 'Kenyatta National Hospital' LIMIT 1), 'nurse', 'General Medicine', 'Critical Care', 'active', 'approved', true, 8, 0),
  ('8e41ee2e-ae74-43a5-a550-a1d02a5591a3'::uuid, (SELECT id FROM health_facilities WHERE name = 'Kenyatta National Hospital' LIMIT 1), 'pharmacist', 'Pharmacy', 'Clinical Pharmacy', 'active', 'approved', false, 6, 0),
  ('8e41ee2e-ae74-43a5-a550-a1d02a5591a3'::uuid, (SELECT id FROM health_facilities WHERE name = 'Kenyatta National Hospital' LIMIT 1), 'lab_technician', 'Laboratory', 'Hematology', 'active', 'approved', true, 5, 0),
  ('8e41ee2e-ae74-43a5-a550-a1d02a5591a3'::uuid, (SELECT id FROM health_facilities WHERE name = 'Kenyatta National Hospital' LIMIT 1), 'receptionist', 'Administration', 'Patient Registration', 'active', 'approved', true, 3, 0),
  ('8e41ee2e-ae74-43a5-a550-a1d02a5591a3'::uuid, (SELECT id FROM health_facilities WHERE name = 'Kenyatta National Hospital' LIMIT 1), 'cashier', 'Finance', 'Insurance Claims', 'active', 'approved', false, 4, 0),
  ('8e41ee2e-ae74-43a5-a550-a1d02a5591a3'::uuid, (SELECT id FROM health_facilities WHERE name = 'Kenyatta National Hospital' LIMIT 1), 'hr_manager', 'Human Resources', 'Staff Relations', 'active', 'approved', true, 10, 0)
ON CONFLICT DO NOTHING;

-- STEP 12: Seed attendance
INSERT INTO health_attendance (staff_id, clock_in, clock_out, duration_minutes, notes)
SELECT id, now() - interval '8 hours', now(), 480, 'Regular shift'
FROM health_staff WHERE status = 'active' AND is_on_duty = true LIMIT 3;

-- STEP 13: Seed shifts
INSERT INTO health_shifts (facility_id, staff_id, date, start_time, end_time, department, notes)
SELECT facility_id, id, CURRENT_DATE, '08:00:00', '17:00:00', department, 'Day shift'
FROM health_staff WHERE status = 'active' LIMIT 5;

-- STEP 14: Seed payroll
INSERT INTO health_payroll (staff_id, month, base_salary, allowances, deductions, status)
SELECT id, to_char(CURRENT_DATE, 'YYYY-MM'),
  CASE role WHEN 'doctor' THEN 150000 WHEN 'nurse' THEN 80000 WHEN 'pharmacist' THEN 95000
    WHEN 'lab_technician' THEN 75000 WHEN 'receptionist' THEN 45000 WHEN 'cashier' THEN 50000
    WHEN 'hr_manager' THEN 120000 ELSE 60000 END,
  5000, 15000, 'paid'
FROM health_staff WHERE status = 'active' LIMIT 5;

-- VERIFICATION
SELECT 'Facilities' as table_name, COUNT(*) as count FROM health_facilities
UNION ALL SELECT 'Departments', COUNT(*) FROM health_departments
UNION ALL SELECT 'Staff', COUNT(*) FROM health_staff
UNION ALL SELECT 'Attendance', COUNT(*) FROM health_attendance
UNION ALL SELECT 'Shifts', COUNT(*) FROM health_shifts
UNION ALL SELECT 'Payroll', COUNT(*) FROM health_payroll;
