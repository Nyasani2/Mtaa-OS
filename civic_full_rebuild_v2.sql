-- ============================================
-- MTAA AFRIQ — CIVIC FRONT DOOR FULL REBUILD V2
-- 17 Tables + RLS + Indexes + Triggers
-- Self-Explaining Government UI Schema
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- STEP 1: MINISTRIES (Root Reference)
-- ============================================
CREATE TABLE ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  contact_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: CIVIC CATEGORIES (Service Categories)
-- ============================================
CREATE TABLE civic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  ministry_id UUID REFERENCES ministries(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: CIVIC SERVICES (Government Service Marketplace)
-- ============================================
CREATE TABLE civic_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  purpose TEXT NOT NULL,
  requirements JSONB DEFAULT '[]',
  outcome TEXT,
  processing_time TEXT,
  fees JSONB DEFAULT '{"amount": 0, "currency": "KES"}',
  responsible_department TEXT,
  ministry_id UUID REFERENCES ministries(id),
  category_id UUID REFERENCES civic_categories(id),
  
  -- Self-Explaining Metadata
  tooltip_summary TEXT,
  eligibility_rules JSONB DEFAULT '[]',
  required_documents JSONB DEFAULT '[]',
  estimated_steps INTEGER DEFAULT 1,
  legal_basis TEXT,
  
  -- Service Versioning (Audit)
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES civic_services(id),
  edited_by UUID,
  edited_at TIMESTAMPTZ,
  edit_reason TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','draft','deprecated')),
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 4: CIVIC PROJECTS (Public Projects)
-- ============================================
CREATE TABLE civic_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  ministry_id UUID REFERENCES ministries(id),
  department TEXT,
  county TEXT,
  constituency TEXT,
  ward TEXT,
  
  budget_allocated NUMERIC(15,2) DEFAULT 0,
  budget_spent NUMERIC(15,2) DEFAULT 0,
  completion_pct INTEGER DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  
  contractor_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','on_track','at_risk','stalled','completed','cancelled')),
  expected_completion DATE,
  
  -- AI Oversight
  ai_hold_reason TEXT,
  ai_risk_level TEXT CHECK (ai_risk_level IN ('low','medium','high','critical')),
  ai_recommendation TEXT,
  presidential_override BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 5: CIVIC CONTRACTORS
-- ============================================
CREATE TABLE civic_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  kra_pin TEXT,
  company_type TEXT,
  agpo_category TEXT,
  agpo_certified BOOLEAN DEFAULT FALSE,
  agpo_cert_number TEXT,
  
  company_score INTEGER DEFAULT 0 CHECK (company_score BETWEEN 0 AND 100),
  score_breakdown JSONB DEFAULT '{}',
  
  projects_completed INTEGER DEFAULT 0,
  projects_stalled INTEGER DEFAULT 0,
  projects_incomplete INTEGER DEFAULT 0,
  total_contract_value NUMERIC(15,2) DEFAULT 0,
  total_paid_out NUMERIC(15,2) DEFAULT 0,
  total_pending NUMERIC(15,2) DEFAULT 0,
  
  blacklist_status TEXT DEFAULT 'clear' CHECK (blacklist_status IN ('clear','watch','blacklisted')),
  blacklist_reason TEXT,
  blacklist_date TIMESTAMPTZ,
  
  tax_compliant BOOLEAN DEFAULT FALSE,
  last_kra_check TIMESTAMPTZ,
  kra_remarks TEXT,
  
  registration_date DATE,
  director_count INTEGER DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  annual_turnover NUMERIC(15,2) DEFAULT 0,
  
  email TEXT,
  phone TEXT,
  physical_address TEXT,
  county TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 6: CIVIC CONTRACTOR DIRECTORS
-- ============================================
CREATE TABLE civic_contractor_directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES civic_contractors(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT,
  nationality TEXT DEFAULT 'Kenyan',
  share_percentage NUMERIC(5,2) DEFAULT 0,
  is_ceo BOOLEAN DEFAULT FALSE,
  is_cfo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: CIVIC BLACKLIST REGISTRY
-- ============================================
CREATE TABLE civic_blacklist_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('individual','company','ngo','government_entity')),
  id_number TEXT,
  kra_pin TEXT,
  reason TEXT NOT NULL,
  blacklist_date TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  related_entities JSONB DEFAULT '[]',
  added_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 8: CIVIC PRESIDENTIAL TRANSACTIONS (Treasury Watch)
-- ============================================
CREATE TABLE civic_presidential_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT NOT NULL,
  ministry_id UUID REFERENCES ministries(id),
  recipient_entity TEXT,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','cabinet_approved','ps_approved','ag_approved','presidential_approved','ai_hold','ai_rejected','released','rejected','cancelled')),
  approvals_received INTEGER DEFAULT 0,
  approvals_required INTEGER DEFAULT 5,
  
  ai_risk_level TEXT CHECK (ai_risk_level IN ('low','medium','high','critical')),
  ai_recommendation TEXT,
  ai_hold_reason TEXT,
  presidential_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  created_by UUID
);

-- ============================================
-- STEP 9: CIVIC DRONE FLEET
-- ============================================
CREATE TABLE civic_drone_fleet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drone_id TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  status TEXT DEFAULT 'standby' CHECK (status IN ('standby','charging','mission','maintenance','offline','crashed')),
  battery_pct INTEGER DEFAULT 100 CHECK (battery_pct BETWEEN 0 AND 100),
  current_lat NUMERIC(10,6),
  current_lng NUMERIC(10,6),
  home_base_lat NUMERIC(10,6) NOT NULL,
  home_base_lng NUMERIC(10,6) NOT NULL,
  total_missions INTEGER DEFAULT 0,
  total_flight_hours NUMERIC(10,2) DEFAULT 0,
  last_mission_at TIMESTAMPTZ,
  firmware_version TEXT,
  max_flight_time INTEGER,
  payload_capacity NUMERIC(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 10: CIVIC DRONE MISSIONS
-- ============================================
CREATE TABLE civic_drone_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drone_id UUID NOT NULL REFERENCES civic_drone_fleet(id),
  project_id UUID REFERENCES civic_projects(id),
  mission_type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','aborted','failed')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  ai_recommendation TEXT,
  ai_risk_level TEXT CHECK (ai_risk_level IN ('low','medium','high','critical')),
  area_covered_sqm NUMERIC(12,2),
  findings_summary TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 11: CIVIC DRONE LOGS
-- ============================================
CREATE TABLE civic_drone_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES civic_drone_missions(id),
  drone_id UUID REFERENCES civic_drone_fleet(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_type TEXT NOT NULL,
  description TEXT,
  lat NUMERIC(10,6),
  lng NUMERIC(10,6),
  altitude NUMERIC(8,2),
  battery_at_event INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 12: CIVIC APPLICATIONS (Citizen Applications)
-- ============================================
CREATE TABLE civic_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES civic_services(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','completed')),
  form_data JSONB DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','waived','failed')),
  payment_amount NUMERIC(10,2),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 13: CIVIC SERVICE VERSIONS (Audit Trail)
-- ============================================
CREATE TABLE civic_service_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES civic_services(id),
  version INTEGER NOT NULL,
  name TEXT,
  description TEXT,
  requirements JSONB,
  fees JSONB,
  processing_time TEXT,
  edited_by UUID,
  edit_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 14: CIVIC TOOLTIP LOGS (Analytics)
-- ============================================
CREATE TABLE civic_tooltip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  element_type TEXT NOT NULL,
  element_id TEXT,
  service_id UUID REFERENCES civic_services(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  session_duration_ms INTEGER
);

-- ============================================
-- STEP 15: CIVIC BIDS (Tender Bids)
-- ============================================
CREATE TABLE civic_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES civic_projects(id),
  contractor_id UUID NOT NULL REFERENCES civic_contractors(id),
  bid_amount NUMERIC(15,2) NOT NULL,
  proposal_summary TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','shortlisted','accepted','rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ,
  evaluated_by UUID,
  evaluation_notes TEXT
);

-- ============================================
-- STEP 16: CIVIC PERMITS (Project Permits)
-- ============================================
CREATE TABLE civic_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES civic_projects(id),
  permit_type TEXT NOT NULL,
  permit_number TEXT,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','revoked','pending')),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 17: CIVIC SERVICE EDITORS (Gov Admin Roles)
-- ============================================
CREATE TABLE civic_service_editors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ministry_id UUID REFERENCES ministries(id),
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_publish BOOLEAN DEFAULT FALSE,
  can_disable BOOLEAN DEFAULT FALSE,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_services_category ON civic_services(category_id);
CREATE INDEX idx_services_status ON civic_services(status);
CREATE INDEX idx_services_featured ON civic_services(is_featured);
CREATE INDEX idx_projects_status ON civic_projects(status);
CREATE INDEX idx_projects_ministry ON civic_projects(ministry_id);
CREATE INDEX idx_contractors_blacklist ON civic_contractors(blacklist_status);
CREATE INDEX idx_contractors_score ON civic_contractors(company_score DESC);
CREATE INDEX idx_transactions_status ON civic_presidential_transactions(status);
CREATE INDEX idx_drone_status ON civic_drone_fleet(status);
CREATE INDEX idx_drone_missions_drone ON civic_drone_missions(drone_id);
CREATE INDEX idx_applications_user ON civic_applications(user_id);
CREATE INDEX idx_applications_status ON civic_applications(status);
CREATE INDEX idx_blacklist_active ON civic_blacklist_registry(is_active);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE civic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_presidential_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_drone_fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_drone_missions ENABLE ROW LEVEL SECURITY;

-- Services: Public read, Admin write
CREATE POLICY "Services public read" ON civic_services FOR SELECT USING (status = 'active');
CREATE POLICY "Services admin write" ON civic_services FOR ALL USING (auth.uid() IN (SELECT user_id FROM civic_service_editors WHERE can_edit = TRUE AND revoked_at IS NULL));

-- Projects: Public read
CREATE POLICY "Projects public read" ON civic_projects FOR SELECT USING (true);

-- Contractors: Public read
CREATE POLICY "Contractors public read" ON civic_contractors FOR SELECT USING (true);

-- Applications: User owns, Admin reviews
CREATE POLICY "Applications user read" ON civic_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Applications user insert" ON civic_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions: Public read (transparency)
CREATE POLICY "Transactions public read" ON civic_presidential_transactions FOR SELECT USING (true);

-- Drones: Public read
CREATE POLICY "Drones public read" ON civic_drone_fleet FOR SELECT USING (true);
CREATE POLICY "Drone missions public read" ON civic_drone_missions FOR SELECT USING (true);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ministries_updated_at BEFORE UPDATE ON ministries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON civic_services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON civic_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contractors_updated_at BEFORE UPDATE ON civic_contractors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON civic_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER drone_fleet_updated_at BEFORE UPDATE ON civic_drone_fleet FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Service Versioning Trigger
CREATE OR REPLACE FUNCTION log_service_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.version = NEW.version THEN
    NEW.version = OLD.version + 1;
    NEW.edited_at = NOW();
    
    INSERT INTO civic_service_versions (
      service_id, version, name, description, requirements, fees, processing_time, edited_by, edit_reason
    ) VALUES (
      OLD.id, OLD.version, OLD.name, OLD.description, OLD.requirements, OLD.fees, OLD.processing_time, OLD.edited_by, OLD.edit_reason
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_versioning BEFORE UPDATE ON civic_services FOR EACH ROW EXECUTE FUNCTION log_service_version();

SELECT 'CIVIC FRONT DOOR REBUILD COMPLETE — 17 tables, indexes, RLS, triggers created' AS status;
