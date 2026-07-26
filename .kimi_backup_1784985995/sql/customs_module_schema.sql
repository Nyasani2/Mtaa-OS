-- Customs Module Schema
CREATE TABLE IF NOT EXISTS customs_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number text NOT NULL UNIQUE,
  entry_type text NOT NULL CHECK (entry_type IN ('import', 'export', 'transit')),
  declarant_name text NOT NULL,
  consignee text NOT NULL,
  cargo_value numeric DEFAULT 0,
  currency text DEFAULT 'KES',
  duty_payable numeric DEFAULT 0,
  port_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('cleared', 'pending', 'under_review', 'rejected', 'inspection_required')),
  lodged_at timestamptz DEFAULT now(),
  cleared_at timestamptz
);

CREATE TABLE IF NOT EXISTS tariff_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code text NOT NULL UNIQUE,
  description text NOT NULL,
  duty_rate numeric DEFAULT 0,
  import_duty numeric DEFAULT 0,
  vat_rate numeric DEFAULT 0,
  excise_rate numeric DEFAULT 0,
  idf_rate numeric DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bonded_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_name text NOT NULL,
  license_number text NOT NULL UNIQUE,
  operator_name text NOT NULL,
  location text NOT NULL,
  capacity_sqm numeric DEFAULT 0,
  occupied_sqm numeric DEFAULT 0,
  goods_value numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS excise_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_number text NOT NULL UNIQUE,
  holder_name text NOT NULL,
  license_type text NOT NULL,
  product_category text NOT NULL,
  business_location text NOT NULL,
  annual_volume text,
  excise_duty_paid numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'pending', 'revoked', 'suspended')),
  issued_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customs_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id text NOT NULL UNIQUE,
  entry_number text NOT NULL,
  inspection_type text NOT NULL,
  result text NOT NULL DEFAULT 'pending' CHECK (result IN ('cleared', 'flagged', 'pending', 're_inspection')),
  officer_name text NOT NULL,
  inspection_location text NOT NULL,
  findings text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customs_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Enable RLS
ALTER TABLE customs_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonded_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE excise_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customs_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE customs_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "customs_entries_read" ON customs_entries FOR SELECT USING (true);
CREATE POLICY "tariff_schedule_read" ON tariff_schedule FOR SELECT USING (true);
CREATE POLICY "bonded_warehouses_read" ON bonded_warehouses FOR SELECT USING (true);
CREATE POLICY "excise_licenses_read" ON excise_licenses FOR SELECT USING (true);
CREATE POLICY "customs_inspections_read" ON customs_inspections FOR SELECT USING (true);
CREATE POLICY "customs_alerts_read" ON customs_alerts FOR SELECT USING (true);
