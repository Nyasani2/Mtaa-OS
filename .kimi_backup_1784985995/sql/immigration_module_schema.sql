-- Immigration Module Schema
CREATE TABLE IF NOT EXISTS passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  national_id text NOT NULL,
  passport_type text NOT NULL DEFAULT 'ordinary',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'renewal_due', 'revoked', 'lost')),
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  renewal_due boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_number text NOT NULL UNIQUE,
  applicant_name text NOT NULL,
  passport_number text NOT NULL,
  visa_type text NOT NULL,
  nationality text NOT NULL,
  entries_allowed integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected', 'expired', 'revoked')),
  issued_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visa_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name text NOT NULL,
  passport_number text NOT NULL,
  visa_type text NOT NULL,
  nationality text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE TABLE IF NOT EXISTS work_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_number text NOT NULL UNIQUE,
  holder_name text NOT NULL,
  permit_type text NOT NULL,
  nationality text NOT NULL,
  employer_name text NOT NULL,
  sector text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'pending', 'revoked', 'renewal_due')),
  issued_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS border_crossings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crossing_type text NOT NULL CHECK (crossing_type IN ('entry', 'exit')),
  traveler_name text NOT NULL,
  passport_number text NOT NULL,
  nationality text NOT NULL,
  border_point text NOT NULL,
  travel_mode text NOT NULL,
  visa_number text,
  crossed_at timestamptz DEFAULT now(),
  overstay_days integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS overstays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_name text NOT NULL,
  passport_number text NOT NULL,
  nationality text NOT NULL,
  document_type text NOT NULL,
  document_number text NOT NULL,
  expiry_date date NOT NULL,
  last_entry_date date NOT NULL,
  border_point text NOT NULL,
  overstay_days integer NOT NULL DEFAULT 0,
  action_taken text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS immigration_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Enable RLS
ALTER TABLE passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE visas ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE border_crossings ENABLE ROW LEVEL SECURITY;
ALTER TABLE overstays ENABLE ROW LEVEL SECURITY;
ALTER TABLE immigration_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "passports_read" ON passports FOR SELECT USING (true);
CREATE POLICY "visas_read" ON visas FOR SELECT USING (true);
CREATE POLICY "visa_applications_read" ON visa_applications FOR SELECT USING (true);
CREATE POLICY "work_permits_read" ON work_permits FOR SELECT USING (true);
CREATE POLICY "border_crossings_read" ON border_crossings FOR SELECT USING (true);
CREATE POLICY "overstays_read" ON overstays FOR SELECT USING (true);
CREATE POLICY "immigration_alerts_read" ON immigration_alerts FOR SELECT USING (true);
