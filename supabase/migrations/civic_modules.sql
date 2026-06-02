
-- ============================================================
-- MTAA CIVIC MODULES: TRANSPORT (NTSA) + AGRICULTURE (KEPHIS)
-- 12 tables + RLS policies + indexes
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: TRANSPORT / NTSA TABLES (6 tables)
-- ============================================================

-- 1. driving_licenses
CREATE TABLE IF NOT EXISTS driving_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    license_number TEXT NOT NULL UNIQUE,
    category TEXT[] NOT NULL DEFAULT '{}',
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'revoked')),
    county TEXT NOT NULL,
    blood_group TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. vehicle_registrations
CREATE TABLE IF NOT EXISTS vehicle_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plate_number TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    engine_number TEXT NOT NULL,
    chassis_number TEXT NOT NULL,
    body_type TEXT NOT NULL,
    fuel_type TEXT NOT NULL DEFAULT 'petrol',
    seating_capacity INTEGER NOT NULL DEFAULT 5,
    tare_weight NUMERIC(10,2),
    gross_weight NUMERIC(10,2),
    registration_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'written_off')),
    county TEXT NOT NULL,
    logbook_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. vehicle_inspections
CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicle_registrations(id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL,
    station TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    result TEXT NOT NULL DEFAULT 'pass' CHECK (result IN ('pass', 'fail', 'conditional')),
    defects TEXT[] DEFAULT '{}',
    certificate_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. traffic_offences
CREATE TABLE IF NOT EXISTS traffic_offences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicle_registrations(id) ON DELETE SET NULL,
    license_id UUID REFERENCES driving_licenses(id) ON DELETE SET NULL,
    offence_type TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    county TEXT NOT NULL,
    offence_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    fine_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    points_deducted INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'contested', 'waived', 'escalated')),
    payment_reference TEXT,
    court_date DATE,
    officer_id UUID NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ntsa_applications
CREATE TABLE IF NOT EXISTS ntsa_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_license', 'renewal', 'duplicate', 'endorsement', 'vehicle_registration', 'transfer', 'inspection')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed')),
    data JSONB NOT NULL DEFAULT '{}',
    fees_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    appointment_date DATE,
    completion_date DATE,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. road_incidents
CREATE TABLE IF NOT EXISTS road_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('accident', 'breakdown', 'hazard', 'traffic_jam', 'road_closure')),
    location TEXT NOT NULL,
    county TEXT NOT NULL,
    coordinates JSONB,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'responding', 'resolved', 'closed')),
    photos TEXT[] DEFAULT '{}',
    involved_parties TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PART 2: AGRICULTURE / KEPHIS TABLES (6 tables)
-- ============================================================

-- 7. crop_certificates
CREATE TABLE IF NOT EXISTS crop_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL UNIQUE,
    crop_type TEXT NOT NULL,
    variety TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    origin_county TEXT NOT NULL,
    origin_farm TEXT NOT NULL,
    destination_country TEXT,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
    inspection_date DATE NOT NULL,
    inspector_id UUID NOT NULL,
    phytosanitary_status TEXT NOT NULL DEFAULT 'clean' CHECK (phytosanitary_status IN ('clean', 'treatment_required', 'rejected')),
    treatment_details TEXT,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. seed_licenses
CREATE TABLE IF NOT EXISTS seed_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    license_number TEXT NOT NULL UNIQUE,
    license_type TEXT NOT NULL CHECK (license_type IN ('producer', 'merchant', 'importer', 'certified')),
    crop_categories TEXT[] NOT NULL DEFAULT '{}',
    business_name TEXT NOT NULL,
    business_address TEXT NOT NULL,
    county TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
    inspection_date DATE NOT NULL,
    inspector_id UUID NOT NULL,
    premises_photo TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. farm_inspections
CREATE TABLE IF NOT EXISTS farm_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL,
    inspector_id UUID NOT NULL,
    inspection_date DATE NOT NULL,
    farm_name TEXT NOT NULL,
    county TEXT NOT NULL,
    crop_types TEXT[] NOT NULL DEFAULT '{}',
    area_hectares NUMERIC(10,2) NOT NULL,
    compliance_status TEXT NOT NULL DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'minor_violations', 'major_violations', 'non_compliant')),
    violations TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    next_inspection_date DATE NOT NULL,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. pest_disease_reports
CREATE TABLE IF NOT EXISTS pest_disease_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pest_disease_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pest', 'disease', 'weed', 'invasive_species')),
    affected_crop TEXT NOT NULL,
    county TEXT NOT NULL,
    location TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low', 'moderate', 'high', 'severe')),
    area_affected_hectares NUMERIC(10,2) NOT NULL DEFAULT 0,
    symptoms TEXT NOT NULL,
    spread_status TEXT NOT NULL DEFAULT 'spreading' CHECK (spread_status IN ('contained', 'spreading', 'outbreak')),
    control_measures TEXT,
    photos TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'verified', 'under_control', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. agri_applications
CREATE TABLE IF NOT EXISTS agri_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('crop_certificate', 'seed_license', 'farm_inspection', 'pesticide_registration', 'fertilizer_registration', 'export_permit')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed')),
    data JSONB NOT NULL DEFAULT '{}',
    fees_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    inspection_date DATE,
    completion_date DATE,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. market_prices
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity TEXT NOT NULL,
    variety TEXT,
    county TEXT NOT NULL,
    market TEXT NOT NULL,
    price_per_kg NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
    volume_traded NUMERIC(12,2),
    quality_grade TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PART 3: INDEXES
-- ============================================================

-- Transport indexes
CREATE INDEX IF NOT EXISTS idx_driving_licenses_user ON driving_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_driving_licenses_number ON driving_licenses(license_number);
CREATE INDEX IF NOT EXISTS idx_driving_licenses_status ON driving_licenses(status);
CREATE INDEX IF NOT EXISTS idx_driving_licenses_expiry ON driving_licenses(expiry_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_reg_user ON vehicle_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_reg_plate ON vehicle_registrations(plate_number);
CREATE INDEX IF NOT EXISTS idx_vehicle_reg_status ON vehicle_registrations(status);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle ON vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_cert ON vehicle_inspections(certificate_number);

CREATE INDEX IF NOT EXISTS idx_traffic_offences_offender ON traffic_offences(offender_id);
CREATE INDEX IF NOT EXISTS idx_traffic_offences_status ON traffic_offences(status);
CREATE INDEX IF NOT EXISTS idx_traffic_offences_date ON traffic_offences(offence_date);

CREATE INDEX IF NOT EXISTS idx_ntsa_apps_user ON ntsa_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ntsa_apps_status ON ntsa_applications(status);
CREATE INDEX IF NOT EXISTS idx_ntsa_apps_type ON ntsa_applications(type);

CREATE INDEX IF NOT EXISTS idx_road_incidents_county ON road_incidents(county);
CREATE INDEX IF NOT EXISTS idx_road_incidents_status ON road_incidents(status);
CREATE INDEX IF NOT EXISTS idx_road_incidents_type ON road_incidents(type);

-- Agriculture indexes
CREATE INDEX IF NOT EXISTS idx_crop_certs_user ON crop_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_certs_number ON crop_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_crop_certs_status ON crop_certificates(status);

CREATE INDEX IF NOT EXISTS idx_seed_licenses_user ON seed_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_seed_licenses_number ON seed_licenses(license_number);
CREATE INDEX IF NOT EXISTS idx_seed_licenses_status ON seed_licenses(status);

CREATE INDEX IF NOT EXISTS idx_farm_inspections_farm ON farm_inspections(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_inspections_county ON farm_inspections(county);

CREATE INDEX IF NOT EXISTS idx_pest_reports_county ON pest_disease_reports(county);
CREATE INDEX IF NOT EXISTS idx_pest_reports_status ON pest_disease_reports(status);
CREATE INDEX IF NOT EXISTS idx_pest_reports_type ON pest_disease_reports(type);

CREATE INDEX IF NOT EXISTS idx_agri_apps_user ON agri_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_agri_apps_status ON agri_applications(status);

CREATE INDEX IF NOT EXISTS idx_market_prices_commodity ON market_prices(commodity);
CREATE INDEX IF NOT EXISTS idx_market_prices_county ON market_prices(county);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON market_prices(date_recorded);

-- ============================================================
-- PART 4: RLS POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE driving_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_offences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ntsa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_disease_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE agri_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- Transport RLS policies
CREATE POLICY "Users can view own driving licenses" ON driving_licenses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own driving licenses" ON driving_licenses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own driving licenses" ON driving_licenses FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own vehicles" ON vehicle_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own vehicles" ON vehicle_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own vehicles" ON vehicle_registrations FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own vehicle inspections" ON vehicle_inspections FOR SELECT USING (
    vehicle_id IN (SELECT id FROM vehicle_registrations WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view own offences" ON traffic_offences FOR SELECT USING (offender_id = auth.uid());
CREATE POLICY "Users can update own offences (payment)" ON traffic_offences FOR UPDATE USING (offender_id = auth.uid());

CREATE POLICY "Users can view own NTSA applications" ON ntsa_applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own NTSA applications" ON ntsa_applications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own NTSA applications" ON ntsa_applications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Anyone can view road incidents" ON road_incidents FOR SELECT USING (true);
CREATE POLICY "Users can insert road incidents" ON road_incidents FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can update own road incidents" ON road_incidents FOR UPDATE USING (reporter_id = auth.uid());

-- Agriculture RLS policies
CREATE POLICY "Users can view own crop certificates" ON crop_certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own crop certificates" ON crop_certificates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own crop certificates" ON crop_certificates FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own seed licenses" ON seed_licenses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own seed licenses" ON seed_licenses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own seed licenses" ON seed_licenses FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Anyone can view farm inspections" ON farm_inspections FOR SELECT USING (true);

CREATE POLICY "Anyone can view pest reports" ON pest_disease_reports FOR SELECT USING (true);
CREATE POLICY "Users can insert pest reports" ON pest_disease_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can update own pest reports" ON pest_disease_reports FOR UPDATE USING (reporter_id = auth.uid());

CREATE POLICY "Users can view own agri applications" ON agri_applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own agri applications" ON agri_applications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own agri applications" ON agri_applications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Anyone can view market prices" ON market_prices FOR SELECT USING (true);

-- ============================================================
-- PART 5: REALTIME PUBLICATIONS
-- ============================================================

-- Add tables to realtime publication (if not already)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE driving_licenses;
        ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_registrations;
        ALTER PUBLICATION supabase_realtime ADD TABLE traffic_offences;
        ALTER PUBLICATION supabase_realtime ADD TABLE ntsa_applications;
        ALTER PUBLICATION supabase_realtime ADD TABLE road_incidents;
        ALTER PUBLICATION supabase_realtime ADD TABLE crop_certificates;
        ALTER PUBLICATION supabase_realtime ADD TABLE seed_licenses;
        ALTER PUBLICATION supabase_realtime ADD TABLE pest_disease_reports;
        ALTER PUBLICATION supabase_realtime ADD TABLE agri_applications;
        ALTER PUBLICATION supabase_realtime ADD TABLE market_prices;
    END IF;
END $$;

-- ============================================================
-- PART 6: UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach triggers
DROP TRIGGER IF EXISTS update_driving_licenses_updated_at ON driving_licenses;
CREATE TRIGGER update_driving_licenses_updated_at BEFORE UPDATE ON driving_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_registrations_updated_at ON vehicle_registrations;
CREATE TRIGGER update_vehicle_registrations_updated_at BEFORE UPDATE ON vehicle_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_traffic_offences_updated_at ON traffic_offences;
CREATE TRIGGER update_traffic_offences_updated_at BEFORE UPDATE ON traffic_offences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ntsa_applications_updated_at ON ntsa_applications;
CREATE TRIGGER update_ntsa_applications_updated_at BEFORE UPDATE ON ntsa_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_road_incidents_updated_at ON road_incidents;
CREATE TRIGGER update_road_incidents_updated_at BEFORE UPDATE ON road_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crop_certificates_updated_at ON crop_certificates;
CREATE TRIGGER update_crop_certificates_updated_at BEFORE UPDATE ON crop_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seed_licenses_updated_at ON seed_licenses;
CREATE TRIGGER update_seed_licenses_updated_at BEFORE UPDATE ON seed_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pest_disease_reports_updated_at ON pest_disease_reports;
CREATE TRIGGER update_pest_disease_reports_updated_at BEFORE UPDATE ON pest_disease_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agri_applications_updated_at ON agri_applications;
CREATE TRIGGER update_agri_applications_updated_at BEFORE UPDATE ON agri_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DONE: 12 tables, 30+ indexes, 30+ RLS policies, realtime, triggers
-- ============================================================
