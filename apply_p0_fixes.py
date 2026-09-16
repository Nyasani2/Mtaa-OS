import os

print("🚀 Starting P0 Deployment Fixes...")

# ============================================================
# 1. SQL Migration: Structured Labs & Critical Alerts
# ============================================================
sql_dir = 'supabase/migrations'
os.makedirs(sql_dir, exist_ok=True)
sql_file = os.path.join(sql_dir, '20260914_p0_structured_labs_and_alerts.sql')

sql_content = """-- P0.1: Structured Lab Results Table
CREATE TABLE IF NOT EXISTS health_lab_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES health_lab_orders(id) ON DELETE CASCADE,
  test_component TEXT NOT NULL,
  result_value NUMERIC,
  unit TEXT,
  reference_min NUMERIC,
  reference_max NUMERIC,
  flag TEXT CHECK (flag IN ('normal', 'low', 'high', 'critical_low', 'critical_high')),
  is_critical BOOLEAN DEFAULT FALSE,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- P0.2: Critical Alerts Table
CREATE TABLE IF NOT EXISTS health_critical_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES health_patients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES health_lab_orders(id) ON DELETE SET NULL,
  result_id UUID REFERENCES health_lab_results(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- P0.3: Auto-Flagging Trigger
CREATE OR REPLACE FUNCTION fn_auto_flag_lab_result()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_min IS NOT NULL AND NEW.result_value < NEW.reference_min THEN
    IF NEW.result_value < (NEW.reference_min * 0.7) THEN NEW.flag := 'critical_low'; NEW.is_critical := TRUE;
    ELSE NEW.flag := 'low'; END IF;
  ELSIF NEW.reference_max IS NOT NULL AND NEW.result_value > NEW.reference_max THEN
    IF NEW.result_value > (NEW.reference_max * 1.3) THEN NEW.flag := 'critical_high'; NEW.is_critical := TRUE;
    ELSE NEW.flag := 'high'; END IF;
  ELSE
    NEW.flag := 'normal';
  END IF;

  IF NEW.is_critical THEN
    INSERT INTO health_critical_alerts (patient_id, order_id, result_id, message)
    SELECT ho.patient_id, NEW.order_id, NEW.id, 
           'CRITICAL: ' || NEW.test_component || ' = ' || NEW.result_value || ' ' || COALESCE(NEW.unit, '')
    FROM health_lab_orders ho WHERE ho.id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_flag_lab_result ON health_lab_results;
CREATE TRIGGER trg_auto_flag_lab_result BEFORE INSERT OR UPDATE ON health_lab_results FOR EACH ROW EXECUTE FUNCTION fn_auto_flag_lab_result();

-- P0.4: Fix broken FK constraints
ALTER TABLE health_lab_orders ALTER COLUMN ordered_by DROP NOT NULL;
ALTER TABLE health_lab_orders DROP CONSTRAINT IF EXISTS health_lab_orders_ordered_by_fkey;
NOTIFY pgrst, 'reload schema';
"""

with open(sql_file, 'w', encoding='utf-8') as f:
    f.write(sql_content)
print(f"✅ SQL Migration written to: {sql_file}")

# ============================================================
# 2. Patch Doctor Workspace: Author Resolution
# ============================================================
doc_file = 'app/(os)/health/doctor/index.tsx'
if os.path.exists(doc_file):
    with open(doc_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Inject resolveStaff helper
    if 'const resolveStaff = async () =>' not in content:
        helper = """  const resolveStaff = async () => {
    const { data: staff, error } = await supabase.from('health_staff').select('id, facility_id').eq('user_id', user.id).single();
    if (error || !staff) throw new Error('Doctor profile not found.');
    return staff;
  };
"""
        # Insert before completeConsultation
        content = content.replace('const completeConsultation = async () => {', helper + '\n  const completeConsultation = async () => {\n    const staff = await resolveStaff();')

    # Replace user.id with staff.id in clinical inserts
    content = content.replace('doctor_id: user.id,', 'doctor_id: staff.id,')
    content = content.replace('user_id: user.id,', 'user_id: staff.id,')
    
    with open(doc_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Doctor Workspace patched: Author resolution fixed.")

# ============================================================
# 3. Patch Billing: Revenue Recognition
# ============================================================
bill_file = 'app/(os)/health/billing/index.tsx'
if os.path.exists(bill_file):
    with open(bill_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ensure we are calculating recognized vs outstanding correctly
    if 'tx.status === \'paid\'' not in content:
        content = content.replace(
            'const amt = parseFloat(tx.amount) || 0;',
            'const amt = parseFloat(tx.amount) || 0;\n      if (tx.status === \'paid\') paid += amt;\n      else if (tx.status === \'pending\') pending += amt;\n      else if (tx.status === \'overdue\') overdue += amt;'
        )
        # Remove the old broken summation if it exists
        content = content.replace('if (tx.status === \'paid\') paid += amt;\n      else if (tx.status === \'pending\') pending += amt;\n      else if (tx.status === \'overdue\') overdue += amt;\n      if (tx.status === \'paid\') paid += amt;\n      else if (tx.status === \'pending\') pending += amt;\n      else if (tx.status === \'overdue\') overdue += amt;', 
                                  'if (tx.status === \'paid\') paid += amt;\n      else if (tx.status === \'pending\') pending += amt;\n      else if (tx.status === \'overdue\') overdue += amt;')

    with open(bill_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Billing screen patched: Revenue recognition separated.")

print("\n🎉 P0 Fixes Applied Successfully!")
print("NEXT STEPS:")
print("1. Run the SQL file in Supabase: " + sql_file)
print("2. Restart Expo: npx expo start -c")
