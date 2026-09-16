-- ============================================
-- MTAA HEALTH: Corrected Indexes & Schema Fixes
-- Based on ACTUAL column names from your schema
-- ============================================

-- 1. APPOINTMENTS INDEXES (uses provider_id, staff_id, patient_id)
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON health_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON health_appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON health_appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_facility ON health_appointments(facility_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON health_appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON health_appointments(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON health_appointments(appointment_type);

-- 2. VISITS INDEXES (this is where practitioner_id lives)
CREATE INDEX IF NOT EXISTS idx_visits_patient ON health_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_practitioner ON health_visits(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_visits_hospital ON health_visits(hospital_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON health_visits(visit_date);

-- 3. LAB RESULTS INDEXES
CREATE INDEX IF NOT EXISTS idx_lab_results_order ON health_lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_flag ON health_lab_results(flag);
CREATE INDEX IF NOT EXISTS idx_lab_results_entered ON health_lab_results(entered_at);

-- 4. Add missing columns if they don't exist (safe ALTER TABLE)
ALTER TABLE health_appointments ADD COLUMN IF NOT EXISTS vitals_json JSONB;
ALTER TABLE health_appointments ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'routine';
ALTER TABLE health_patients ADD COLUMN IF NOT EXISTS admission_status TEXT DEFAULT 'outpatient';
ALTER TABLE health_patients ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE health_patients ADD COLUMN IF NOT EXISTS ward TEXT;
ALTER TABLE health_patients ADD COLUMN IF NOT EXISTS bed_number TEXT;
ALTER TABLE health_patients ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE health_patients ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE health_patients ADD COLUMN IF NOT EXISTS mrn TEXT;
ALTER TABLE health_patients ADD COLUMN IF NOT EXISTS total_balance NUMERIC DEFAULT 0;
ALTER TABLE health_patients ADD COLUMN IF NOT EXISTS last_visit TIMESTAMPTZ;

-- 5. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS health_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  age INT,
  allergies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_health_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_facility_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  facility_id UUID,
  log_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES health_patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES health_appointments(id),
  encounter_type TEXT,
  vitals_json JSONB,
  recorded_by UUID,
  facility_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS on new tables
ALTER TABLE health_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_facility_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_encounters ENABLE ROW LEVEL SECURITY;

-- 7. Basic RLS policies
CREATE POLICY "Users can view own dependents" ON health_dependents FOR SELECT USING (guardian_user_id = auth.uid());
CREATE POLICY "Users can insert own dependents" ON health_dependents FOR INSERT WITH CHECK (guardian_user_id = auth.uid());
CREATE POLICY "Users can view own vault" ON user_health_vault FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own vault" ON user_health_vault FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own encounters" ON health_encounters FOR SELECT USING (patient_id IN (SELECT id FROM health_patients WHERE user_id = auth.uid()));

-- ============================================
-- DONE ✅ All indexes and schema fixes applied
-- ============================================
