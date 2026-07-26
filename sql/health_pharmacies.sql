-- ============================================================
-- Health Pharmacies Schema
-- Supports: Normal pharmacies + Herbal pharmacies
-- Shared map, separate from hospital internal pharmacy
-- ============================================================

-- Drop existing if rebuilding
DROP TABLE IF EXISTS health_pharmacies CASCADE;

CREATE TABLE health_pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('normal', 'herbal')),
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Nairobi',
  country TEXT NOT NULL DEFAULT 'Kenya',
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Location (PostGIS or simple lat/lng)
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Operating hours
  opening_hours JSONB DEFAULT '{}',
  -- e.g., {"mon":"08:00-20:00", "tue":"08:00-20:00", ...}

  -- Herbal-specific fields (nullable for normal pharmacies)
  herbal_specialties TEXT[], -- e.g., ['moringa', 'neem', 'aloe vera']
  traditional_practitioner TEXT,
  license_number TEXT,

  -- Media
  images TEXT[],
  logo_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,

  -- Metadata
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_health_pharmacies_type ON health_pharmacies(type);
CREATE INDEX idx_health_pharmacies_location ON health_pharmacies(latitude, longitude);
CREATE INDEX idx_health_pharmacies_active ON health_pharmacies(is_active) WHERE is_active = true;
CREATE INDEX idx_health_pharmacies_city ON health_pharmacies(city);

-- Geospatial index (if PostGIS is enabled)
-- CREATE INDEX idx_health_pharmacies_geo ON health_pharmacies USING GIST (
--   ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
-- );

-- RLS Policies
ALTER TABLE health_pharmacies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pharmacies"
  ON health_pharmacies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create pharmacies"
  ON health_pharmacies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Owners and admins can update pharmacies"
  ON health_pharmacies FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Owners and admins can delete pharmacies"
  ON health_pharmacies FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_health_pharmacies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_health_pharmacies_updated_at
  BEFORE UPDATE ON health_pharmacies
  FOR EACH ROW
  EXECUTE FUNCTION update_health_pharmacies_updated_at();

-- Sample data: Normal pharmacies
INSERT INTO health_pharmacies (name, type, description, address, city, latitude, longitude, phone, opening_hours)
VALUES
  ('Nairobi Central Pharmacy', 'normal', 'Full-service pharmacy in the CBD', 'Moi Avenue, Nairobi', 'Nairobi', -1.286389, 36.817223, '+254 20 222 0000', '{"mon":"08:00-22:00","tue":"08:00-22:00","wed":"08:00-22:00","thu":"08:00-22:00","fri":"08:00-22:00","sat":"09:00-20:00","sun":"10:00-18:00"}'),
  ('Kenyatta National Hospital Pharmacy', 'normal', '24-hour hospital pharmacy', 'Hospital Road, Nairobi', 'Nairobi', -1.3011, 36.8072, '+254 20 272 6300', '{"mon":"00:00-23:59","tue":"00:00-23:59","wed":"00:00-23:59","thu":"00:00-23:59","fri":"00:00-23:59","sat":"00:00-23:59","sun":"00:00-23:59"}'),
  ('Mombasa Port Pharmacy', 'normal', 'Pharmacy near the port', 'Moi Avenue, Mombasa', 'Mombasa', -4.0435, 39.6682, '+254 41 222 0000', '{"mon":"08:00-20:00","tue":"08:00-20:00","wed":"08:00-20:00","thu":"08:00-20:00","fri":"08:00-20:00","sat":"09:00-18:00","sun":"10:00-16:00"}');

-- Sample data: Herbal pharmacies
INSERT INTO health_pharmacies (name, type, description, address, city, latitude, longitude, phone, herbal_specialties, traditional_practitioner, license_number, opening_hours)
VALUES
  ('Mama Njenga Herbal Clinic', 'herbal', 'Traditional herbal medicine and consultations', 'Kibera Drive, Nairobi', 'Nairobi', -1.3120, 36.7860, '+254 712 345 678', ARRAY['moringa', 'neem', 'aloe vera', 'ginger', 'turmeric'], 'Mama Njenga Wanjiku', 'THP-NRB-001', '{"mon":"07:00-19:00","tue":"07:00-19:00","wed":"07:00-19:00","thu":"07:00-19:00","fri":"07:00-19:00","sat":"08:00-17:00","sun":"09:00-15:00"}'),
  ('Kisumu Traditional Healing Center', 'herbal', 'Western Kenya herbal remedies and wellness', 'Oginga Odinga Street, Kisumu', 'Kisumu', -0.0917, 34.7680, '+254 723 456 789', ARRAY['warburgia', 'prunus africana', 'aloe ferox', 'asparagus'], 'Baba Ochieng', 'THP-KSM-002', '{"mon":"08:00-18:00","tue":"08:00-18:00","wed":"08:00-18:00","thu":"08:00-18:00","fri":"08:00-18:00","sat":"08:00-16:00","sun":"closed"}'),
  ('Coastal Herbals Mombasa', 'herbal', 'Swahili coastal traditional medicine', 'Old Town, Mombasa', 'Mombasa', -4.0600, 39.6660, '+254 734 567 890', ARRAY['baobab', 'clove', 'cinnamon', 'black seed', 'henna'], 'Bi Fatuma', 'THP-MBA-003', '{"mon":"07:30-18:30","tue":"07:30-18:30","wed":"07:30-18:30","thu":"07:30-18:30","fri":"07:30-18:30","sat":"08:00-16:00","sun":"closed"}');
