-- Border Module Schema
CREATE TABLE IF NOT EXISTS border_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  post_type text NOT NULL DEFAULT 'land',
  is_active boolean DEFAULT true,
  officers_on_duty integer DEFAULT 0,
  crossings_today integer DEFAULT 0,
  pending_inspections integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS border_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  message text NOT NULL,
  border_post_id uuid REFERENCES border_posts(id),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS cargo_manifests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_number text NOT NULL UNIQUE,
  shipper_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'flagged', 'inspection_required')),
  item_count integer DEFAULT 0,
  total_value numeric DEFAULT 0,
  currency text DEFAULT 'KES',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS containers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id text NOT NULL UNIQUE,
  container_type text NOT NULL,
  status text NOT NULL DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'at_border', 'cleared', 'held')),
  current_location text,
  manifest_number text REFERENCES cargo_manifests(manifest_number),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS container_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id uuid REFERENCES containers(id),
  description text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS border_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id text NOT NULL UNIQUE,
  inspection_type text NOT NULL,
  result text NOT NULL DEFAULT 'pending' CHECK (result IN ('cleared', 'flagged', 'pending')),
  officer_name text NOT NULL,
  container_id text,
  findings text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  manifest_number text NOT NULL,
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  factors text[] DEFAULT '{}',
  assessed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transit_guarantees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guarantee_ref text NOT NULL UNIQUE,
  corridor_name text NOT NULL,
  operator_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'pending', 'suspended')),
  guarantee_value numeric DEFAULT 0,
  currency text DEFAULT 'KES',
  origin_border text NOT NULL,
  destination_border text NOT NULL,
  expiry_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS border_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role text NOT NULL,
  border_post_id uuid REFERENCES border_posts(id),
  is_active boolean DEFAULT true,
  is_clocked_in boolean DEFAULT false,
  shift_start text,
  shift_end text,
  last_clock_time timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE border_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE border_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargo_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE border_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE border_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "border_posts_read" ON border_posts FOR SELECT USING (true);
CREATE POLICY "border_alerts_read" ON border_alerts FOR SELECT USING (true);
CREATE POLICY "cargo_manifests_read" ON cargo_manifests FOR SELECT USING (true);
CREATE POLICY "containers_read" ON containers FOR SELECT USING (true);
CREATE POLICY "container_events_read" ON container_events FOR SELECT USING (true);
CREATE POLICY "border_inspections_read" ON border_inspections FOR SELECT USING (true);
CREATE POLICY "risk_scores_read" ON risk_scores FOR SELECT USING (true);
CREATE POLICY "transit_guarantees_read" ON transit_guarantees FOR SELECT USING (true);
CREATE POLICY "border_staff_read" ON border_staff FOR SELECT USING (true);
