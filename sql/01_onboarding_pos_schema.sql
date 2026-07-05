-- ============================================
-- MTAA Health OS: COMPLETE Hospital Onboarding + POS + QR System
-- For ALL medical institutions across Africa
-- ============================================

-- =====================================================
-- PART 1: FACILITY ONBOARDING & VERIFICATION
-- =====================================================

-- Facility registration queue (before verification)
CREATE TABLE IF NOT EXISTS health_facility_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pharmacy','clinic','laboratory','diagnostic_center','hospital','specialist_center','maternity','dental','optical','physiotherapy','ambulance_service')),
  ownership TEXT NOT NULL CHECK (ownership IN ('private','public','faith_based','ngo','community','parastatal')),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 6), -- 1=pharmacy, 6=tertiary hospital

  -- Location
  country TEXT NOT NULL DEFAULT 'Kenya',
  county TEXT,
  sub_county TEXT,
  ward TEXT,
  town TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,

  -- Contact
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,

  -- Capacity (scalable: 1-bed clinic to 5000-bed hospital)
  bed_capacity INTEGER DEFAULT 0,
  icu_beds INTEGER DEFAULT 0,
  nicu_beds INTEGER DEFAULT 0,
  operating_theatres INTEGER DEFAULT 0,

  -- Services
  specialties TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  is_24hr BOOLEAN DEFAULT false,
  has_emergency BOOLEAN DEFAULT false,
  has_ambulance BOOLEAN DEFAULT false,
  has_icu BOOLEAN DEFAULT false,
  has_maternity BOOLEAN DEFAULT false,
  has_dialysis BOOLEAN DEFAULT false,
  has_radiology BOOLEAN DEFAULT false,

  -- Operating Hours
  operating_hours JSONB DEFAULT '{"monday":"08:00-17:00","tuesday":"08:00-17:00","wednesday":"08:00-17:00","thursday":"08:00-17:00","friday":"08:00-17:00","saturday":"09:00-13:00","sunday":"closed","emergency":"24h"}'::jsonb,

  -- Registration Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','verified','rejected','suspended','blacklisted')),

  -- Founder/Primary Contact (the person registering)
  founder_user_id UUID NOT NULL REFERENCES auth.users(id),
  founder_name TEXT NOT NULL,
  founder_id_number TEXT,
  founder_phone TEXT,
  founder_email TEXT,
  founder_role TEXT DEFAULT 'facility_admin',

  -- License & Registration
  license_number TEXT,
  license_body TEXT, -- e.g., 'KMPDB', 'Ministry of Health', 'County Govt'
  registration_number TEXT,
  tax_pin TEXT,

  -- Documents (URLs to uploaded files)
  license_document_url TEXT,
  accreditation_document_url TEXT,
  facility_photos JSONB DEFAULT '[]'::jsonb, -- Array of photo URLs

  -- Verification
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id), -- Government inspector
  verification_notes TEXT,
  rejection_reason TEXT,

  -- Government Oversight
  county_health_officer_id UUID REFERENCES auth.users(id),
  national_ministry_approved BOOLEAN DEFAULT false,

  -- Succession / Delegation
  successor_user_id UUID REFERENCES auth.users(id), -- If founder dies, this person takes over
  successor_name TEXT,
  successor_phone TEXT,
  successor_relationship TEXT, -- 'spouse', 'partner', 'child', 'colleague', 'appointed'
  succession_document_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_facility_registrations ENABLE ROW LEVEL SECURITY;

-- RLS: Founder can view/edit their own registration
CREATE POLICY "Founders manage own registrations"
  ON health_facility_registrations FOR ALL
  USING (founder_user_id = auth.uid());

-- RLS: Government inspectors can view all
CREATE POLICY "Inspectors view all registrations"
  ON health_facility_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs
      WHERE hs.user_id = auth.uid() 
      AND hs.role IN ('government_inspector', 'system_admin')
      AND hs.status = 'active'
    )
  );

-- RLS: County health officers can view their county
CREATE POLICY "County officers view county registrations"
  ON health_facility_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs
      JOIN health_facilities hf ON hs.facility_id = hf.id
      WHERE hs.user_id = auth.uid() 
      AND hs.role = 'county_health_officer'
      AND hs.status = 'active'
      AND health_facility_registrations.county = hf.county
    )
  );

-- =====================================================
-- PART 2: MULTI-ADMIN & SUCCESSION SYSTEM
-- =====================================================

-- Facility admins table (multiple admins per facility)
CREATE TABLE IF NOT EXISTS health_facility_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Admin Level
  admin_level TEXT NOT NULL DEFAULT 'manager' CHECK (admin_level IN ('founder', 'director', 'manager', 'supervisor', 'accountant', 'it_admin')),

  -- Permissions
  can_manage_staff BOOLEAN DEFAULT false,
  can_manage_inventory BOOLEAN DEFAULT false,
  can_manage_finance BOOLEAN DEFAULT false,
  can_manage_patients BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_edit_settings BOOLEAN DEFAULT false,
  can_delete_data BOOLEAN DEFAULT false,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'removed', 'deceased')),

  -- Contact
  phone TEXT,
  email TEXT,

  -- Emergency Contact (for succession)
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  appointed_by UUID REFERENCES auth.users(id),
  appointed_at TIMESTAMPTZ DEFAULT now(),
  removed_at TIMESTAMPTZ,
  removed_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(facility_id, user_id)
);

ALTER TABLE health_facility_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view own facility admins"
  ON health_facility_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_facility_admins hfa2
      WHERE hfa2.facility_id = health_facility_admins.facility_id
      AND hfa2.user_id = auth.uid()
      AND hfa2.status = 'active'
    )
  );

CREATE POLICY "Founders and directors manage admins"
  ON health_facility_admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM health_facility_admins hfa2
      WHERE hfa2.facility_id = health_facility_admins.facility_id
      AND hfa2.user_id = auth.uid()
      AND hfa2.admin_level IN ('founder', 'director')
      AND hfa2.status = 'active'
    )
  );

-- =====================================================
-- PART 3: INVENTORY MANAGEMENT (Pharmacy/Lab/General)
-- =====================================================

CREATE TABLE IF NOT EXISTS health_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,

  -- Product Info
  name TEXT NOT NULL,
  generic_name TEXT,
  brand_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('medication','medical_supply','laboratory_reagent','equipment','vaccine','consumable','implant','diagnostic_kit')),
  sub_category TEXT, -- e.g., 'antibiotic', 'painkiller', 'surgical_glove'

  -- Identification
  sku TEXT, -- Internal stock keeping unit
  barcode TEXT,
  qr_code_data TEXT, -- Generated QR for scanning

  -- Drug-specific (if medication)
  drug_form TEXT CHECK (drug_form IN ('tablet','capsule','syrup','injection','cream','ointment','drops','inhaler','suppository','patch')),
  strength TEXT, -- e.g., '500mg', '250mg/5ml'
  dosage_unit TEXT,

  -- Batch Tracking
  batch_number TEXT,
  manufacturer TEXT,
  manufactured_date DATE,
  expiry_date DATE,

  -- Stock
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_of_measure TEXT NOT NULL DEFAULT 'pieces', -- pieces, boxes, bottles, vials, packs
  reorder_level INTEGER DEFAULT 10,
  max_stock INTEGER,

  -- Pricing
  cost_price NUMERIC DEFAULT 0, -- What facility pays
  selling_price NUMERIC DEFAULT 0, -- What patient pays
  markup_percentage NUMERIC DEFAULT 0,

  -- Location within facility
  storage_location TEXT, -- e.g., 'Shelf A3', 'Cold Room', 'Dispensary'
  temperature_requirement TEXT, -- e.g., 'room_temp', '2-8C', 'frozen'

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','recalled','disposed','out_of_stock')),

  -- Tracking
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facility staff view inventory"
  ON health_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs
      WHERE hs.facility_id = health_inventory.facility_id
      AND hs.user_id = auth.uid()
      AND hs.status = 'active'
    )
  );

CREATE POLICY "Pharmacists and admins manage inventory"
  ON health_inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs
      WHERE hs.facility_id = health_inventory.facility_id
      AND hs.user_id = auth.uid()
      AND hs.role IN ('pharmacist', 'lab_technician', 'hospital_admin', 'system_admin')
      AND hs.status = 'active'
    )
  );

-- =====================================================
-- PART 4: INVENTORY TRANSACTIONS (Audit Trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS health_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES health_inventory(id),

  -- Transaction Type
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stock_in','stock_out','adjustment','returned','expired','recalled','transferred')),

  -- Quantities
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,

  -- For stock_out: who received it
  patient_id UUID REFERENCES auth.users(id), -- If dispensed to patient
  staff_id UUID REFERENCES health_staff(id), -- If internal use
  prescription_id UUID, -- Link to prescription

  -- For stock_in: supplier info
  supplier_name TEXT,
  supplier_invoice TEXT,

  -- Reason
  reason TEXT,
  notes TEXT,

  -- Audit
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT now(),

  -- QR Scan reference
  qr_scan_reference TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view facility transactions"
  ON health_inventory_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs
      WHERE hs.facility_id = health_inventory_transactions.facility_id
      AND hs.user_id = auth.uid()
      AND hs.status = 'active'
    )
  );

-- =====================================================
-- PART 5: POS TRANSACTIONS (QR Scan Payments)
-- =====================================================

CREATE TABLE IF NOT EXISTS health_pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,

  -- Transaction Info
  transaction_code TEXT NOT NULL UNIQUE, -- e.g., 'POS-KNH-20260705-001'

  -- Patient (buyer)
  patient_id UUID REFERENCES auth.users(id),
  patient_name TEXT,
  patient_phone TEXT,

  -- Items purchased
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  /*
    [
      {
        "inventory_id": "uuid",
        "name": "Paracetamol 500mg",
        "quantity": 2,
        "unit_price": 50.00,
        "total_price": 100.00,
        "batch_number": "BATCH-001",
        "qr_scanned": true
      }
    ]
  */

  -- Financials
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,

  -- Payment
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mtaa_wallet','cash','mpesa','card','insurance','mixed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','processing','completed','failed','refunded')),

  -- MTAA Wallet specific
  wallet_transaction_id UUID, -- Link to wallet transactions table
  wallet_reference TEXT,

  -- QR Code
  qr_code_data TEXT, -- The QR that was scanned
  scanned_by UUID REFERENCES auth.users(id), -- Staff who scanned
  scanned_at TIMESTAMPTZ,

  -- Prescription link
  prescription_id UUID,
  prescribed_by UUID REFERENCES health_staff(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','dispensed','cancelled','returned')),

  -- Refund
  refund_amount NUMERIC DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  refunded_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view facility POS transactions"
  ON health_pos_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs
      WHERE hs.facility_id = health_pos_transactions.facility_id
      AND hs.user_id = auth.uid()
      AND hs.status = 'active'
    )
  );

CREATE POLICY "Cashiers and pharmacists create POS transactions"
  ON health_pos_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_staff hs
      WHERE hs.facility_id = health_pos_transactions.facility_id
      AND hs.user_id = auth.uid()
      AND hs.role IN ('cashier', 'pharmacist', 'hospital_admin', 'system_admin')
      AND hs.status = 'active'
    )
  );

-- =====================================================
-- PART 6: DRUG TRACKING (Batch-level traceability)
-- =====================================================

CREATE TABLE IF NOT EXISTS health_drug_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES health_inventory(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,

  -- Batch Info
  batch_number TEXT NOT NULL,
  serial_number TEXT, -- Individual unit tracking

  -- Manufacturer
  manufacturer TEXT,
  manufactured_date DATE,
  expiry_date DATE NOT NULL,

  -- Quantity tracking
  quantity_received INTEGER NOT NULL,
  quantity_dispensed INTEGER DEFAULT 0,
  quantity_remaining INTEGER GENERATED ALWAYS AS (quantity_received - quantity_dispensed) STORED,

  -- Supply chain
  supplier_name TEXT,
  supplier_license TEXT,
  import_permit_number TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','recalled','disposed','damaged')),
  recall_reason TEXT,
  recalled_at TIMESTAMPTZ,
  recalled_by UUID REFERENCES auth.users(id),

  -- QR Code for each batch
  qr_code_data TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_drug_tracking ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 7: GOVERNMENT INSPECTORS & OVERSIGHT
-- =====================================================

CREATE TABLE IF NOT EXISTS health_government_inspectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Inspector Info
  inspector_id TEXT NOT NULL UNIQUE, -- Government ID
  full_name TEXT NOT NULL,
  department TEXT NOT NULL, -- 'Ministry of Health', 'County Health', 'Pharmacy Board'
  jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('national','county','sub_county','regional')),
  jurisdiction_area TEXT, -- e.g., 'Nairobi County', 'Central Region'

  -- Role
  role TEXT NOT NULL CHECK (role IN ('inspector','senior_inspector','director','auditor','investigator')),

  -- Permissions
  can_verify_facilities BOOLEAN DEFAULT false,
  can_suspend_facilities BOOLEAN DEFAULT false,
  can_audit_inventory BOOLEAN DEFAULT false,
  can_view_all_records BOOLEAN DEFAULT false,
  can_issue_penalties BOOLEAN DEFAULT false,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','retired')),

  appointed_by UUID REFERENCES auth.users(id),
  appointed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_government_inspectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inspectors view own record"
  ON health_government_inspectors FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System admins manage inspectors"
  ON health_government_inspectors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM health_staff hs
      WHERE hs.user_id = auth.uid() 
      AND hs.role = 'system_admin'
      AND hs.status = 'active'
    )
  );

-- =====================================================
-- PART 8: FACILITY SUCCESSION / DELEGATION LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS health_facility_successions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES health_facilities(id) ON DELETE CASCADE,

  -- Previous admin
  previous_admin_id UUID NOT NULL REFERENCES auth.users(id),
  previous_admin_name TEXT,
  previous_admin_status TEXT NOT NULL CHECK (previous_admin_status IN ('resigned','deceased','incapacitated','removed','transferred')),

  -- New admin
  new_admin_id UUID NOT NULL REFERENCES auth.users(id),
  new_admin_name TEXT,
  new_admin_relationship TEXT, -- 'spouse', 'child', 'colleague', 'court_appointed', 'election'

  -- Documentation
  succession_document_url TEXT,
  court_order_url TEXT,
  death_certificate_url TEXT,

  -- Approval
  approved_by UUID REFERENCES auth.users(id), -- Government inspector who approved
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','under_review')),

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_facility_successions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 9: SEED DATA FOR GOVERNMENT OVERSIGHT
-- =====================================================

-- Make the user a government inspector too (dual role)
INSERT INTO health_government_inspectors (
  user_id, inspector_id, full_name, department, jurisdiction_type, jurisdiction_area,
  role, can_verify_facilities, can_suspend_facilities, can_audit_inventory, 
  can_view_all_records, can_issue_penalties, status
)
VALUES (
  '8e41ee2e-ae74-43a5-a550-a1d02a5591a3'::uuid,
  'INS-MOH-001',
  'System Administrator',
  'Ministry of Health',
  'national',
  'Kenya',
  'director',
  true, true, true, true, true,
  'active'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Facility Registrations' as table_name, COUNT(*) as count FROM health_facility_registrations
UNION ALL SELECT 'Facility Admins', COUNT(*) FROM health_facility_admins
UNION ALL SELECT 'Inventory', COUNT(*) FROM health_inventory
UNION ALL SELECT 'Inventory Transactions', COUNT(*) FROM health_inventory_transactions
UNION ALL SELECT 'POS Transactions', COUNT(*) FROM health_pos_transactions
UNION ALL SELECT 'Drug Tracking', COUNT(*) FROM health_drug_tracking
UNION ALL SELECT 'Government Inspectors', COUNT(*) FROM health_government_inspectors
UNION ALL SELECT 'Facility Successions', COUNT(*) FROM health_facility_successions;
