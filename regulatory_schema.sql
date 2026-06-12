-- Regulatory Module Tables

-- Tax Revenue Collection
CREATE TABLE IF NOT EXISTS regulatory_tax_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL CHECK (country_code IN ('KE','UG','TZ','RW','ET','NG','ZA')),
  tax_type TEXT NOT NULL CHECK (tax_type IN ('income','vat','corporate','customs','property')),
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  target NUMERIC(15,2) NOT NULL DEFAULT 0,
  period TEXT NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Business Registrations
CREATE TABLE IF NOT EXISTS regulatory_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL CHECK (country_code IN ('KE','UG','TZ','RW','ET','NG','ZA')),
  business_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  tax_pin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','dormant')),
  sector TEXT,
  annual_turnover NUMERIC(15,2) DEFAULT 0,
  registered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tax Payments
CREATE TABLE IF NOT EXISTS regulatory_tax_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL CHECK (country_code IN ('KE','UG','TZ','RW','ET','NG','ZA')),
  business_id UUID REFERENCES regulatory_businesses(id),
  tax_type TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid','pending','overdue')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance Reports
CREATE TABLE IF NOT EXISTS regulatory_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL CHECK (country_code IN ('KE','UG','TZ','RW','ET','NG','ZA')),
  total_businesses INTEGER NOT NULL DEFAULT 0,
  compliant_businesses INTEGER NOT NULL DEFAULT 0,
  tax_collection_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(country_code, period)
);

-- Summary RPC Function
CREATE OR REPLACE FUNCTION get_regulatory_summary(p_country TEXT)
RETURNS TABLE (
  total_collected NUMERIC,
  collection_rate NUMERIC,
  total_businesses BIGINT,
  overdue_payments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(tr.amount), 0)::NUMERIC as total_collected,
    COALESCE(AVG(CASE WHEN tr.target > 0 THEN (tr.amount / tr.target) * 100 ELSE 0 END), 0)::NUMERIC as collection_rate,
    (SELECT COUNT(*) FROM regulatory_businesses WHERE country_code = p_country) as total_businesses,
    (SELECT COUNT(*) FROM regulatory_tax_payments WHERE country_code = p_country AND status = 'overdue') as overdue_payments
  FROM regulatory_tax_revenue tr
  WHERE tr.country_code = p_country;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE regulatory_tax_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_tax_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regulatory_read_all" ON regulatory_tax_revenue FOR SELECT USING (true);
CREATE POLICY "regulatory_read_all" ON regulatory_businesses FOR SELECT USING (true);
CREATE POLICY "regulatory_read_all" ON regulatory_tax_payments FOR SELECT USING (true);
CREATE POLICY "regulatory_read_all" ON regulatory_compliance FOR SELECT USING (true);
