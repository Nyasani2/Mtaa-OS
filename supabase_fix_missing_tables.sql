-- 1. Create Lab Results Table
CREATE TABLE IF NOT EXISTS health_lab_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES health_lab_orders(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  result_value TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'verified',
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Imaging Requests Table
CREATE TABLE IF NOT EXISTS health_imaging_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES health_patients(id) ON DELETE CASCADE,
  modality TEXT NOT NULL,
  body_part TEXT NOT NULL,
  priority TEXT DEFAULT 'routine',
  status TEXT DEFAULT 'ordered',
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Invoices Table (For Billing/Cashier)
CREATE TABLE IF NOT EXISTS health_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES health_patients(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create EHR Records Table (For Patient Vault)
CREATE TABLE IF NOT EXISTS health_ehr_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES health_patients(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE health_lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_imaging_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_ehr_records ENABLE ROW LEVEL SECURITY;

-- 6. Basic RLS Policies (Allow authenticated users to read/write their own data)
CREATE POLICY "Allow all for authenticated users on lab_results" ON health_lab_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users on imaging" ON health_imaging_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users on invoices" ON health_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users on ehr" ON health_ehr_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

