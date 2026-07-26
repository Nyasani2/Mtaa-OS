-- ============================================================
-- CIVIC v2 BACKEND: Multi-Country, Multi-Jurisdiction, Modular
-- Built informed by existing MTAA public schema
-- WARNING: Run in order. Existing tables are NOT dropped.
-- ============================================================

-- ============================================================
-- 01: CORE CIVIC TABLES (New — bridge Police/Courts/Prisons)
-- ============================================================

-- Civic Departments (Police, Courts, Prisons, Revenue, etc.)
CREATE TABLE IF NOT EXISTS public.civic_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  app_package TEXT NOT NULL,
  is_core BOOLEAN DEFAULT false,
  requires_department UUID REFERENCES public.civic_departments(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed all departments (idempotent — uses ON CONFLICT)
INSERT INTO public.civic_departments (name, code, app_package, is_core, requires_department) VALUES
  ('Police', 'POLICE', '@mtaa/police', true, null),
  ('Courts', 'COURTS', '@mtaa/courts', true, null),
  ('Prisons', 'PRISONS', '@mtaa/prisons', false, null),
  ('Revenue Authority', 'REVENUE', '@mtaa/revenue', false, null),
  ('Ports Authority', 'PORTS', '@mtaa/ports', false, null),
  ('Treasury', 'TREASURY', '@mtaa/treasury', false, null),
  ('Health', 'HEALTH', '@mtaa/health', false, null),
  ('Education', 'EDUCATION', '@mtaa/education', false, null),
  ('Immigration', 'IMMIGRATION', '@mtaa/immigration', false, null),
  ('Lands', 'LANDS', '@mtaa/lands', false, null),
  ('Transport', 'TRANSPORT', '@mtaa/transport', false, null)
ON CONFLICT (code) DO NOTHING;

-- Jurisdictions: The operating unit for each department
-- A police station, a courthouse, a prison, a revenue office
CREATE TABLE IF NOT EXISTS public.civic_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES public.civic_countries(id),
  county_id UUID REFERENCES public.civic_counties(id),
  department_id UUID NOT NULL REFERENCES public.civic_departments(id),
  parent_jurisdiction_id UUID REFERENCES public.civic_jurisdictions(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT CHECK (type IN ('station', 'office', 'court', 'prison', 'hospital', 'school', 'port', 'border')) NOT NULL,
  location JSONB,
  contact JSONB,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ,
  UNIQUE(country_id, department_id, code)
);

-- Department activation per country (presidential toggle)
CREATE TABLE IF NOT EXISTS public.country_department_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES public.civic_countries(id),
  department_id UUID NOT NULL REFERENCES public.civic_departments(id),
  is_active BOOLEAN DEFAULT false,
  activated_by UUID REFERENCES auth.users(id),
  activated_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  UNIQUE(country_id, department_id)
);

-- Users within jurisdictions (officers, judges, wardens, clerks)
CREATE TABLE IF NOT EXISTS public.civic_personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  jurisdiction_id UUID NOT NULL REFERENCES public.civic_jurisdictions(id),
  department_id UUID NOT NULL REFERENCES public.civic_departments(id),
  role TEXT NOT NULL,
  badge_number TEXT,
  rank TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 02: RLS HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_jurisdiction_ids(user_uuid UUID)
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT jurisdiction_id FROM public.civic_personnel 
    WHERE user_id = user_uuid AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 03: POLICE MODULE — LINK EXISTING TABLES TO JURISDICTIONS
-- ============================================================

-- Add jurisdiction_id to police_stations if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'police_stations' AND column_name = 'jurisdiction_id'
  ) THEN
    ALTER TABLE public.police_stations ADD COLUMN jurisdiction_id UUID REFERENCES public.civic_jurisdictions(id);
  END IF;
END $$;

-- Add jurisdiction_id to police_officers if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'police_officers' AND column_name = 'jurisdiction_id'
  ) THEN
    ALTER TABLE public.police_officers ADD COLUMN jurisdiction_id UUID REFERENCES public.civic_jurisdictions(id);
  END IF;
END $$;

-- Add jurisdiction_id to police_cases if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'police_cases' AND column_name = 'jurisdiction_id'
  ) THEN
    ALTER TABLE public.police_cases ADD COLUMN jurisdiction_id UUID REFERENCES public.civic_jurisdictions(id);
  END IF;
END $$;

-- Add court handoff fields to police_cases if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'police_cases' AND column_name = 'court_case_id'
  ) THEN
    ALTER TABLE public.police_cases 
      ADD COLUMN court_case_id UUID,
      ADD COLUMN handoff_status TEXT DEFAULT 'none' CHECK (handoff_status IN ('none', 'ready', 'submitted', 'accepted', 'rejected', 'returned')),
      ADD COLUMN handoff_notes TEXT,
      ADD COLUMN handoff_at TIMESTAMPTZ,
      ADD COLUMN returned_at TIMESTAMPTZ,
      ADD COLUMN return_reason TEXT;
  END IF;
END $$;

-- RLS: Police cases — personnel can only see their jurisdiction + sub-jurisdictions
ALTER TABLE public.police_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS police_cases_jurisdiction ON public.police_cases;
CREATE POLICY police_cases_jurisdiction ON public.police_cases
  FOR ALL USING (
    jurisdiction_id = ANY(get_user_jurisdiction_ids(auth.uid()))
    OR auth.uid() IN (SELECT user_id FROM public.civic_personnel WHERE role = 'super_admin')
  );

ALTER TABLE public.police_officers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS police_officers_jurisdiction ON public.police_officers;
CREATE POLICY police_officers_jurisdiction ON public.police_officers
  FOR ALL USING (
    jurisdiction_id = ANY(get_user_jurisdiction_ids(auth.uid()))
    OR auth.uid() IN (SELECT user_id FROM public.civic_personnel WHERE role = 'super_admin')
  );

-- ============================================================
-- 04: COURTS MODULE (New — Standalone-First, Connects to Police)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.court_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES public.civic_jurisdictions(id),
  house_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  court_level TEXT CHECK (court_level IN ('magistrate', 'high_court', 'court_of_appeal', 'supreme_court')) NOT NULL,
  location JSONB,
  contact JSONB,
  room_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.court_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES public.civic_jurisdictions(id),
  house_id UUID REFERENCES public.court_houses(id),
  name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  capacity INTEGER DEFAULT 50,
  has_recording BOOLEAN DEFAULT false,
  has_video BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.court_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES public.civic_jurisdictions(id),
  user_id UUID REFERENCES auth.users(id),
  personnel_id UUID REFERENCES public.civic_personnel(id),
  judge_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialization TEXT[],
  court_level TEXT CHECK (court_level IN ('magistrate', 'high_court', 'appeal', 'supreme')) NOT NULL,
  current_caseload INTEGER DEFAULT 0,
  total_cases INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.court_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES public.civic_jurisdictions(id),
  house_id UUID REFERENCES public.court_houses(id),
  police_case_id UUID REFERENCES public.police_cases(id),
  police_station_id UUID REFERENCES public.police_stations(id),
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('filed', 'scheduled', 'arraignment', 'pretrial', 'trial', 'deliberation', 'judgment', 'sentenced', 'appealed', 'appeal_hearing', 'closed', 'dismissed')) DEFAULT 'filed',
  case_type TEXT NOT NULL,
  filing_date TIMESTAMPTZ DEFAULT now(),
  judge_id UUID REFERENCES public.court_judges(id),
  courtroom_id UUID REFERENCES public.court_rooms(id),
  plaintiff_count INTEGER DEFAULT 0,
  defendant_count INTEGER DEFAULT 0,
  witness_count INTEGER DEFAULT 0,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.court_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.court_cases(id),
  party_type TEXT CHECK (party_type IN ('plaintiff', 'defendant', 'witness', 'lawyer_plaintiff', 'lawyer_defendant', 'expert', 'interpreter')) NOT NULL,
  full_name TEXT NOT NULL,
  id_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  organization TEXT,
  representation TEXT,
  is_minor BOOLEAN DEFAULT false,
  requires_interpreter BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.court_hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.court_cases(id),
  hearing_type TEXT CHECK (hearing_type IN ('arraignment', 'pretrial_conference', 'trial', 'sentencing', 'bail_hearing', 'appeal', 'review', 'contempt')) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  courtroom_id UUID REFERENCES public.court_rooms(id),
  judge_id UUID REFERENCES public.court_judges(id),
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'postponed', 'adjourned', 'cancelled')) DEFAULT 'scheduled',
  notes TEXT,
  attendees UUID[] DEFAULT '{}',
  transcript_url TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.court_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.court_cases(id),
  hearing_id UUID REFERENCES public.court_hearings(id),
  judge_id UUID NOT NULL REFERENCES public.court_judges(id),
  judgment_type TEXT CHECK (judgment_type IN ('guilty', 'not_guilty', 'dismissed', 'settlement', 'directed_verdict', 'mistrial', 'pending_appeal')) NOT NULL,
  verdict TEXT,
  sentence TEXT,
  prison_sentence_months INTEGER,
  probation_months INTEGER,
  fine_amount DECIMAL(15,2),
  restitution_amount DECIMAL(15,2),
  community_service_hours INTEGER,
  suspended_sentence BOOLEAN DEFAULT false,
  effective_date TIMESTAMPTZ,
  is_final BOOLEAN DEFAULT false,
  appeal_deadline TIMESTAMPTZ,
  prison_intake_id UUID,
  prison_handoff_status TEXT CHECK (prison_handoff_status IN ('none', 'pending', 'submitted', 'accepted')) DEFAULT 'none',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.court_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_case_id UUID NOT NULL REFERENCES public.court_cases(id),
  appeal_case_id UUID REFERENCES public.court_cases(id),
  appellant_party_id UUID REFERENCES public.court_parties(id),
  grounds TEXT NOT NULL,
  status TEXT CHECK (status IN ('filed', 'scheduled', 'heard', 'upheld', 'overturned', 'modified', 'dismissed')) DEFAULT 'filed',
  filed_at TIMESTAMPTZ DEFAULT now(),
  hearing_id UUID REFERENCES public.court_hearings(id),
  decision TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Courts
ALTER TABLE public.court_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS court_cases_jurisdiction ON public.court_cases;
CREATE POLICY court_cases_jurisdiction ON public.court_cases
  FOR ALL USING (
    jurisdiction_id = ANY(get_user_jurisdiction_ids(auth.uid()))
    OR auth.uid() IN (SELECT user_id FROM public.civic_personnel WHERE role = 'super_admin')
  );

ALTER TABLE public.court_judges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS court_judges_jurisdiction ON public.court_judges;
CREATE POLICY court_judges_jurisdiction ON public.court_judges
  FOR ALL USING (
    jurisdiction_id = ANY(get_user_jurisdiction_ids(auth.uid()))
    OR auth.uid() IN (SELECT user_id FROM public.civic_personnel WHERE role = 'super_admin')
  );

-- ============================================================
-- 05: PRISONS MODULE (New — Standalone OR Connected to Courts)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prison_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES public.civic_jurisdictions(id),
  facility_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('maximum_security', 'medium_security', 'minimum_security', 'remand', 'juvenile', 'women', 'psychiatric')) NOT NULL,
  location JSONB,
  contact JSONB,
  capacity INTEGER NOT NULL,
  current_population INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prison_wardens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES public.civic_jurisdictions(id),
  facility_id UUID REFERENCES public.prison_facilities(id),
  user_id UUID REFERENCES auth.users(id),
  personnel_id UUID REFERENCES public.civic_personnel(id),
  warden_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  rank TEXT CHECK (rank IN ('warden', 'senior_warden', 'superintendent', 'deputy_superintendent', 'commissioner')) NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prison_inmates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES public.civic_jurisdictions(id),
  facility_id UUID NOT NULL REFERENCES public.prison_facilities(id),
  court_case_id UUID REFERENCES public.court_cases(id),
  court_judgment_id UUID REFERENCES public.court_judgments(id),
  inmate_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  aliases TEXT[],
  photo_url TEXT,
  id_number TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  nationality TEXT,
  sentence_type TEXT CHECK (sentence_type IN ('awaiting_trial', 'remand', 'convicted', 'life', 'death')) NOT NULL,
  sentence_start DATE,
  sentence_end DATE,
  sentence_length_months INTEGER,
  time_served_months INTEGER DEFAULT 0,
  parole_eligible_date DATE,
  status TEXT CHECK (status IN ('admitted', 'transferred', 'released', 'paroled', 'escaped', 'deceased', 'appeal_pending')) DEFAULT 'admitted',
  cell_block TEXT,
  cell_number TEXT,
  medical_conditions TEXT[],
  emergency_contact JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prison_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inmate_id UUID NOT NULL REFERENCES public.prison_inmates(id),
  from_facility_id UUID REFERENCES public.prison_facilities(id),
  to_facility_id UUID REFERENCES public.prison_facilities(id),
  movement_type TEXT CHECK (movement_type IN ('admission', 'transfer', 'release', 'parole', 'escape', 'recapture', 'hospital', 'court_appearance', 'deceased')) NOT NULL,
  reason TEXT,
  authorized_by UUID REFERENCES public.prison_wardens(id),
  occurred_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prison_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inmate_id UUID NOT NULL REFERENCES public.prison_inmates(id),
  visitor_name TEXT NOT NULL,
  visitor_id_number TEXT,
  visitor_relationship TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'denied')) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Prisons
ALTER TABLE public.prison_inmates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prison_inmates_jurisdiction ON public.prison_inmates;
CREATE POLICY prison_inmates_jurisdiction ON public.prison_inmates
  FOR ALL USING (
    jurisdiction_id = ANY(get_user_jurisdiction_ids(auth.uid()))
    OR auth.uid() IN (SELECT user_id FROM public.civic_personnel WHERE role = 'super_admin')
  );

ALTER TABLE public.prison_facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prison_facilities_jurisdiction ON public.prison_facilities;
CREATE POLICY prison_facilities_jurisdiction ON public.prison_facilities
  FOR ALL USING (
    jurisdiction_id = ANY(get_user_jurisdiction_ids(auth.uid()))
    OR auth.uid() IN (SELECT user_id FROM public.civic_personnel WHERE role = 'super_admin')
  );

-- ============================================================
-- 06: INTER-DEPARTMENT PROTOCOL TRIGGERS
-- ============================================================

-- Trigger: When police case status = 'ready_for_prosecution', auto-set handoff_status = 'ready'
CREATE OR REPLACE FUNCTION police_case_handoff_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ready_for_prosecution' AND OLD.status != 'ready_for_prosecution' THEN
    NEW.handoff_status := 'ready';
    NEW.handoff_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS police_case_handoff ON public.police_cases;
CREATE TRIGGER police_case_handoff
  BEFORE UPDATE ON public.police_cases
  FOR EACH ROW
  EXECUTE FUNCTION police_case_handoff_trigger();

-- Trigger: When court judgment has prison_sentence_months, auto-create prison intake
CREATE OR REPLACE FUNCTION court_judgment_prison_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_facility_id UUID;
  v_inmate_id UUID;
  v_jurisdiction_id UUID;
BEGIN
  IF NEW.prison_sentence_months IS NOT NULL AND NEW.prison_handoff_status = 'none' THEN
    -- Find nearest prison facility in same jurisdiction
    SELECT c.jurisdiction_id INTO v_jurisdiction_id
    FROM public.court_cases c WHERE c.id = NEW.case_id;

    SELECT id INTO v_facility_id
    FROM public.prison_facilities
    WHERE jurisdiction_id = v_jurisdiction_id
      AND type = CASE WHEN NEW.prison_sentence_months > 120 THEN 'maximum_security' ELSE 'medium_security' END
      AND current_population < capacity
    ORDER BY current_population ASC
    LIMIT 1;

    IF v_facility_id IS NOT NULL THEN
      -- Create inmate record
      INSERT INTO public.prison_inmates (
        jurisdiction_id, facility_id, court_case_id, court_judgment_id,
        inmate_number, full_name, sentence_type, sentence_start,
        sentence_length_months, sentence_end, status
      )
      SELECT 
        v_jurisdiction_id, v_facility_id, NEW.case_id, NEW.id,
        'P-' || cc.case_number, 
        cp.full_name,
        'convicted',
        CURRENT_DATE,
        NEW.prison_sentence_months,
        CURRENT_DATE + (NEW.prison_sentence_months || ' months')::INTERVAL,
        'admitted'
      FROM public.court_cases cc
      LEFT JOIN public.court_parties cp ON cp.case_id = cc.id AND cp.party_type = 'defendant'
      WHERE cc.id = NEW.case_id
      LIMIT 1
      RETURNING id INTO v_inmate_id;

      -- Update judgment
      NEW.prison_intake_id := v_inmate_id;
      NEW.prison_handoff_status := 'submitted';

      -- Update facility population
      UPDATE public.prison_facilities 
      SET current_population = current_population + 1 
      WHERE id = v_facility_id;

      -- Create movement record
      INSERT INTO public.prison_movements (
        inmate_id, to_facility_id, movement_type, reason, occurred_at
      ) VALUES (
        v_inmate_id, v_facility_id, 'admission', 
        'Sentence from case ' || (SELECT case_number FROM public.court_cases WHERE id = NEW.case_id),
        now()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS court_judgment_prison ON public.court_judgments;
CREATE TRIGGER court_judgment_prison
  BEFORE INSERT OR UPDATE ON public.court_judgments
  FOR EACH ROW
  EXECUTE FUNCTION court_judgment_prison_trigger();

-- ============================================================
-- 07: PRESIDENTIAL ACTIVATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION activate_country_civic(country_id UUID, activated_by UUID)
RETURNS VOID AS $$
DECLARE
  dept RECORD;
BEGIN
  -- Activate country
  UPDATE public.civic_countries 
  SET is_active = true 
  WHERE id = country_id;

  -- Activate all core departments
  FOR dept IN SELECT * FROM public.civic_departments WHERE is_core = true
  LOOP
    INSERT INTO public.country_department_status (country_id, department_id, is_active, activated_by, activated_at)
    VALUES (country_id, dept.id, true, activated_by, now())
    ON CONFLICT (country_id, department_id) 
    DO UPDATE SET is_active = true, activated_by = activated_by, activated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 08: INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_civic_jurisdictions_country ON public.civic_jurisdictions(country_id);
CREATE INDEX IF NOT EXISTS idx_civic_jurisdictions_department ON public.civic_jurisdictions(department_id);
CREATE INDEX IF NOT EXISTS idx_civic_personnel_user ON public.civic_personnel(user_id);
CREATE INDEX IF NOT EXISTS idx_civic_personnel_jurisdiction ON public.civic_personnel(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_police_cases_jurisdiction ON public.police_cases(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_police_cases_status ON public.police_cases(status);
CREATE INDEX IF NOT EXISTS idx_police_cases_handoff ON public.police_cases(handoff_status);
CREATE INDEX IF NOT EXISTS idx_court_cases_jurisdiction ON public.court_cases(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_court_cases_police ON public.court_cases(police_case_id);
CREATE INDEX IF NOT EXISTS idx_court_cases_status ON public.court_cases(status);
CREATE INDEX IF NOT EXISTS idx_court_judgments_case ON public.court_judgments(case_id);
CREATE INDEX IF NOT EXISTS idx_prison_inmates_jurisdiction ON public.prison_inmates(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_prison_inmates_facility ON public.prison_inmates(facility_id);
CREATE INDEX IF NOT EXISTS idx_prison_inmates_case ON public.prison_inmates(court_case_id);
CREATE INDEX IF NOT EXISTS idx_prison_movements_inmate ON public.prison_movements(inmate_id);

-- ============================================================
-- END OF CIVIC v2 SCHEMA
-- ============================================================
