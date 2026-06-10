
-- ============================================================================
-- MTAA HEALTH MODULE - COMPLETE DATABASE SCHEMA
-- Run this on Supabase SQL Editor or psql terminal
-- ============================================================================
-- IMPORTANT: This schema PLUGS INTO existing tables. Do NOT recreate auth.users,
-- public.accounts, public.wallets, public.transactions, etc.
-- ============================================================================

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location-based hospital search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption

-- ============================================================================
-- SECTION 1: HOSPITAL REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_hospitals (
    id                          BIGSERIAL PRIMARY KEY,
    account_id                  BIGINT NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    hospital_name               VARCHAR(255) NOT NULL,
    hospital_code               VARCHAR(50) UNIQUE NOT NULL,
    registration_number         VARCHAR(100) UNIQUE,

    -- Classification (Kenya health system levels + private)
    hospital_type               VARCHAR(50) NOT NULL CHECK (hospital_type IN (
        'level_1_dispensary', 'level_2_health_center', 'level_3_subcounty',
        'level_4_county_referral', 'level_5_national_referral', 
        'private_clinic', 'private_hospital', 'faith_based', 'specialized'
    )),
    bed_capacity                INTEGER DEFAULT 0,

    -- Location
    county_id                   BIGINT REFERENCES public.counties(id),
    subcounty_id                BIGINT REFERENCES public.subcounties(id),
    ward_id                     BIGINT REFERENCES public.wards(id),
    latitude                    DECIMAL(10,8),
    longitude                   DECIMAL(11,8),

    -- Contact
    emergency_phone             VARCHAR(20),
    admin_phone                 VARCHAR(20),
    email                       VARCHAR(255),

    -- SHA Integration
    sha_provider_number         VARCHAR(100) UNIQUE,
    sha_contract_status         VARCHAR(20) DEFAULT 'pending' CHECK (sha_contract_status IN ('pending', 'active', 'suspended', 'terminated')),
    sha_contract_start_date     TIMESTAMPTZ,
    sha_contract_end_date       TIMESTAMPTZ,

    -- Wallet (links to existing wallet system)
    wallet_id                   BIGINT REFERENCES public.wallets(id),

    -- Management System Access
    management_system_url       VARCHAR(500),
    api_key_encrypted           TEXT,
    last_sync_at                TIMESTAMPTZ,

    -- Operating Status
    is_24hr                     BOOLEAN DEFAULT false,
    operating_hours             JSONB DEFAULT '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "13:00"}, "sunday": {"open": null, "close": null}}',

    -- Transparency
    is_public_dashboard_enabled BOOLEAN DEFAULT true,
    public_dashboard_url        VARCHAR(500),

    -- Metadata
    services_offered            JSONB DEFAULT '[]',
    equipment_list              JSONB DEFAULT '[]',

    status                      VARCHAR(20) DEFAULT 'pending_approval' CHECK (status IN (
        'pending_approval', 'active', 'suspended', 'closed'
    )),

    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    created_by                  UUID REFERENCES auth.users(id)
);

-- Indexes for health_hospitals
CREATE INDEX IF NOT EXISTS idx_health_hospitals_account ON public.health_hospitals(account_id);
CREATE INDEX IF NOT EXISTS idx_health_hospitals_county ON public.health_hospitals(county_id);
CREATE INDEX IF NOT EXISTS idx_health_hospitals_type ON public.health_hospitals(hospital_type);
CREATE INDEX IF NOT EXISTS idx_health_hospitals_status ON public.health_hospitals(status);
CREATE INDEX IF NOT EXISTS idx_health_hospitals_sha ON public.health_hospitals(sha_contract_status);

-- GIST index for location search (requires postgis)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        CREATE INDEX IF NOT EXISTS idx_health_hospitals_location 
        ON public.health_hospitals USING GIST (ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326));
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: HOSPITAL DEPARTMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_departments (
    id              BIGSERIAL PRIMARY KEY,
    hospital_id     BIGINT NOT NULL REFERENCES public.health_hospitals(id) ON DELETE CASCADE,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(50),
    floor_number    VARCHAR(20),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_departments_hospital ON public.health_departments(hospital_id);

-- ============================================================================
-- SECTION 3: DOCTOR REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_doctors (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Professional Credentials
    license_number              VARCHAR(100) UNIQUE NOT NULL,
    license_issue_date          DATE,
    license_expiry_date         DATE,
    license_status              VARCHAR(20) DEFAULT 'active' CHECK (license_status IN ('active', 'suspended', 'expired', 'revoked')),

    -- Specialization
    primary_specialty           VARCHAR(100),
    secondary_specialties       JSONB DEFAULT '[]',
    qualifications              JSONB DEFAULT '[]',

    -- Employment
    employment_type             VARCHAR(20) CHECK (employment_type IN ('government', 'private', 'contract', 'locum')),
    is_government_employee      BOOLEAN DEFAULT false,

    -- Biometric Payroll
    payroll_number              VARCHAR(100),
    biometric_template_id       VARCHAR(255),

    -- Ratings & Performance
    rating_average              DECIMAL(2,1) DEFAULT 5.0 CHECK (rating_average >= 0 AND rating_average <= 5),
    total_patients_seen         INTEGER DEFAULT 0,
    total_reviews               INTEGER DEFAULT 0,

    -- Availability
    is_available_for_telemedicine BOOLEAN DEFAULT false,
    consultation_fee            DECIMAL(12,2),

    status                      VARCHAR(20) DEFAULT 'pending_verification' CHECK (status IN (
        'pending_verification', 'active', 'suspended', 'blacklisted'
    )),

    verified_by                 UUID REFERENCES auth.users(id),
    verified_at                 TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_doctors_user ON public.health_doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_health_doctors_license ON public.health_doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_health_doctors_status ON public.health_doctors(status);
CREATE INDEX IF NOT EXISTS idx_health_doctors_specialty ON public.health_doctors(primary_specialty);
CREATE INDEX IF NOT EXISTS idx_health_doctors_govt ON public.health_doctors(is_government_employee) WHERE is_government_employee = true;

-- ============================================================================
-- SECTION 4: DOCTOR-HOSPITAL ASSIGNMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_doctor_hospitals (
    id                      BIGSERIAL PRIMARY KEY,
    doctor_id               BIGINT NOT NULL REFERENCES public.health_doctors(id) ON DELETE CASCADE,
    hospital_id             BIGINT NOT NULL REFERENCES public.health_hospitals(id) ON DELETE CASCADE,
    department_id           BIGINT REFERENCES public.health_departments(id),

    is_primary_hospital     BOOLEAN DEFAULT false,
    role_at_hospital        VARCHAR(50),

    working_days            JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]',
    shift_preference        VARCHAR(20) CHECK (shift_preference IN ('morning', 'afternoon', 'night', 'rotation')),

    is_govt_payroll_active  BOOLEAN DEFAULT false,
    monthly_salary          DECIMAL(12,2),

    assigned_at             TIMESTAMPTZ DEFAULT NOW(),
    assigned_by             UUID REFERENCES auth.users(id),
    is_active               BOOLEAN DEFAULT true,

    UNIQUE(doctor_id, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_hospitals_doctor ON public.health_doctor_hospitals(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_hospitals_hospital ON public.health_doctor_hospitals(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctor_hospitals_active ON public.health_doctor_hospitals(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_doctor_hospitals_payroll ON public.health_doctor_hospitals(is_govt_payroll_active) WHERE is_govt_payroll_active = true;

-- ============================================================================
-- SECTION 5: BIOMETRIC ATTENDANCE (Clock-in/Clock-out)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_biometric_attendance (
    id                      BIGSERIAL PRIMARY KEY,
    doctor_id               BIGINT NOT NULL REFERENCES public.health_doctors(id),
    hospital_id             BIGINT NOT NULL REFERENCES public.health_hospitals(id),

    clock_in_at             TIMESTAMPTZ NOT NULL,
    clock_in_method         VARCHAR(20) CHECK (clock_in_method IN ('fingerprint', 'facial', 'qr_code', 'manual_override')),
    clock_in_verified       BOOLEAN DEFAULT false,
    clock_in_location       JSONB,
    clock_in_device_id      VARCHAR(100),

    clock_out_at            TIMESTAMPTZ,
    clock_out_method        VARCHAR(20),
    clock_out_verified      BOOLEAN DEFAULT false,

    total_hours             DECIMAL(6,2),

    is_payroll_processed    BOOLEAN DEFAULT false,
    payroll_period_id       BIGINT,

    override_reason         TEXT,
    override_by             UUID REFERENCES auth.users(id),
    override_at             TIMESTAMPTZ,

    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biometric_attendance_doctor ON public.health_biometric_attendance(doctor_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_hospital ON public.health_biometric_attendance(hospital_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_date ON public.health_biometric_attendance(clock_in_at);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_payroll ON public.health_biometric_attendance(is_payroll_processed) WHERE is_payroll_processed = false;
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_open ON public.health_biometric_attendance(clock_out_at) WHERE clock_out_at IS NULL;

-- ============================================================================
-- SECTION 6: PATIENT QUEUE ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_patient_queues (
    id                      BIGSERIAL PRIMARY KEY,
    hospital_id             BIGINT NOT NULL REFERENCES public.health_hospitals(id),
    department_id           BIGINT REFERENCES public.health_departments(id),

    patient_id              UUID NOT NULL REFERENCES auth.users(id),
    patient_priority        INTEGER DEFAULT 50 CHECK (patient_priority >= 1 AND patient_priority <= 100),

    queue_status            VARCHAR(20) DEFAULT 'waiting' CHECK (queue_status IN (
        'waiting', 'called', 'in_consultation', 'completed', 'no_show', 'cancelled'
    )),

    assigned_doctor_id      BIGINT REFERENCES public.health_doctors(id),
    assigned_at             TIMESTAMPTZ,

    checked_in_at           TIMESTAMPTZ DEFAULT NOW(),
    called_at               TIMESTAMPTZ,
    consultation_started_at TIMESTAMPTZ,
    consultation_ended_at   TIMESTAMPTZ,

    estimated_wait_minutes  INTEGER,
    actual_wait_minutes     INTEGER,

    chief_complaint         TEXT,
    triage_notes            TEXT,
    triage_level            VARCHAR(20) CHECK (triage_level IN ('resuscitation', 'emergency', 'urgent', 'less_urgent', 'non_urgent')),

    sha_coverage_confirmed  BOOLEAN DEFAULT false,
    sha_authorization_code  VARCHAR(100),

    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_queues_hospital ON public.health_patient_queues(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patient_queues_status ON public.health_patient_queues(queue_status);
CREATE INDEX IF NOT EXISTS idx_patient_queues_patient ON public.health_patient_queues(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_queues_doctor ON public.health_patient_queues(assigned_doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_queues_waiting ON public.health_patient_queues(checked_in_at) WHERE queue_status = 'waiting';

-- ============================================================================
-- SECTION 7: ELECTRONIC HEALTH RECORDS (EHR)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_ehr_records (
    id                          BIGSERIAL PRIMARY KEY,
    patient_id                  UUID NOT NULL REFERENCES auth.users(id),

    hospital_id                 BIGINT NOT NULL REFERENCES public.health_hospitals(id),
    doctor_id                   BIGINT NOT NULL REFERENCES public.health_doctors(id),
    queue_id                    BIGINT REFERENCES public.health_patient_queues(id),
    visit_date                  DATE NOT NULL DEFAULT CURRENT_DATE,

    chief_complaint             TEXT,
    history_of_present_illness  TEXT,
    past_medical_history        JSONB DEFAULT '[]',
    family_history              JSONB DEFAULT '[]',
    social_history              JSONB DEFAULT '[]',

    vital_signs                 JSONB DEFAULT '{}',
    physical_examination        TEXT,

    primary_diagnosis_icd10     VARCHAR(10),
    primary_diagnosis_name      VARCHAR(255),
    secondary_diagnoses         JSONB DEFAULT '[]',

    prescriptions               JSONB DEFAULT '[]',
    procedures                  JSONB DEFAULT '[]',
    lab_orders                  JSONB DEFAULT '[]',
    imaging_orders              JSONB DEFAULT '[]',

    doctor_notes                TEXT,
    follow_up_required          BOOLEAN DEFAULT false,
    follow_up_date              DATE,

    is_confidential             BOOLEAN DEFAULT false,
    access_granted_to           JSONB DEFAULT '[]',

    sha_claim_submitted         BOOLEAN DEFAULT false,
    sha_claim_amount            DECIMAL(12,2),
    sha_claim_status            VARCHAR(20) DEFAULT 'pending',

    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    created_by                  UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ehr_patient ON public.health_ehr_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_ehr_hospital ON public.health_ehr_records(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ehr_doctor ON public.health_ehr_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ehr_visit_date ON public.health_ehr_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_ehr_icd10 ON public.health_ehr_records(primary_diagnosis_icd10);
CREATE INDEX IF NOT EXISTS idx_ehr_claim ON public.health_ehr_records(sha_claim_submitted) WHERE sha_claim_submitted = false;

-- ============================================================================
-- SECTION 8: SHA CLAIMS & REAL-TIME PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_sha_claims (
    id                      BIGSERIAL PRIMARY KEY,

    claim_number            VARCHAR(100) UNIQUE NOT NULL,
    ehr_record_id           BIGINT NOT NULL REFERENCES public.health_ehr_records(id),

    hospital_id             BIGINT NOT NULL REFERENCES public.health_hospitals(id),
    hospital_wallet_id      BIGINT REFERENCES public.wallets(id),

    patient_id              UUID NOT NULL REFERENCES auth.users(id),
    patient_wallet_id       BIGINT REFERENCES public.wallets(id),

    services_rendered       JSONB NOT NULL DEFAULT '[]',
    total_claim_amount      DECIMAL(12,2) NOT NULL,

    sha_fund_pool_id        BIGINT,
    sha_verified_by         UUID REFERENCES auth.users(id),
    sha_verified_at         TIMESTAMPTZ,
    sha_verification_notes  TEXT,

    payment_status          VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'verified', 'approved', 'paid', 'rejected', 'disputed'
    )),
    paid_at                 TIMESTAMPTZ,
    transaction_id          BIGINT REFERENCES public.transactions(id),

    is_public               BOOLEAN DEFAULT true,
    public_view_hash        VARCHAR(64),

    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sha_claims_hospital ON public.health_sha_claims(hospital_id);
CREATE INDEX IF NOT EXISTS idx_sha_claims_patient ON public.health_sha_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_sha_claims_status ON public.health_sha_claims(payment_status);
CREATE INDEX IF NOT EXISTS idx_sha_claims_public ON public.health_sha_claims(public_view_hash);
CREATE INDEX IF NOT EXISTS idx_sha_claims_pending ON public.health_sha_claims(created_at) WHERE payment_status = 'pending';

-- ============================================================================
-- SECTION 9: SHA FUND POOL (The Kitty)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_sha_fund_pools (
    id                      BIGSERIAL PRIMARY KEY,
    pool_name               VARCHAR(100) NOT NULL,
    pool_code               VARCHAR(50) UNIQUE NOT NULL,

    total_contributions     DECIMAL(15,2) DEFAULT 0,
    total_paid_out          DECIMAL(15,2) DEFAULT 0,
    current_balance         DECIMAL(15,2) DEFAULT 0,

    total_contributors      INTEGER DEFAULT 0,
    active_contributors     INTEGER DEFAULT 0,

    coverage_type           VARCHAR(20) CHECK (coverage_type IN ('national', 'county', 'private', 'corporate')),
    covered_counties        JSONB DEFAULT '[]',

    pool_status             VARCHAR(20) DEFAULT 'active' CHECK (pool_status IN ('pending', 'active', 'frozen', 'closed')),

    public_dashboard_enabled BOOLEAN DEFAULT true,

    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sha_pools_code ON public.health_sha_fund_pools(pool_code);
CREATE INDEX IF NOT EXISTS idx_sha_pools_status ON public.health_sha_fund_pools(pool_status);

-- ============================================================================
-- SECTION 10: SHA CONTRIBUTOR MEMBERSHIP
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_sha_contributors (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 UUID NOT NULL REFERENCES auth.users(id),
    pool_id                 BIGINT NOT NULL REFERENCES public.health_sha_fund_pools(id),

    membership_number       VARCHAR(100) UNIQUE NOT NULL,
    membership_type         VARCHAR(20) CHECK (membership_type IN ('individual', 'family', 'corporate', 'government_sponsored')),

    monthly_contribution    DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    last_contribution_at    TIMESTAMPTZ,
    next_contribution_due   DATE,
    contributions_made      INTEGER DEFAULT 0,

    is_active               BOOLEAN DEFAULT true,
    is_delinquent           BOOLEAN DEFAULT false,
    delinquency_reason      VARCHAR(100),

    dependents              JSONB DEFAULT '[]',

    enrolled_at             TIMESTAMPTZ DEFAULT NOW(),
    enrolled_by             UUID REFERENCES auth.users(id),

    UNIQUE(user_id, pool_id)
);

CREATE INDEX IF NOT EXISTS idx_sha_contributors_user ON public.health_sha_contributors(user_id);
CREATE INDEX IF NOT EXISTS idx_sha_contributors_pool ON public.health_sha_contributors(pool_id);
CREATE INDEX IF NOT EXISTS idx_sha_contributors_active ON public.health_sha_contributors(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sha_contributors_due ON public.health_sha_contributors(next_contribution_due);

-- ============================================================================
-- SECTION 11: GOVERNMENT PAYROLL - BIOMETRIC LINKED
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_govt_payroll (
    id                      BIGSERIAL PRIMARY KEY,

    employee_id             UUID NOT NULL REFERENCES auth.users(id),
    doctor_id               BIGINT REFERENCES public.health_doctors(id),

    hospital_id             BIGINT NOT NULL REFERENCES public.health_hospitals(id),
    department_id           BIGINT REFERENCES public.health_departments(id),
    job_title               VARCHAR(100) NOT NULL,
    employment_grade        VARCHAR(20),

    basic_salary            DECIMAL(12,2) NOT NULL,
    allowances              JSONB DEFAULT '{}',
    deductions              JSONB DEFAULT '{}',
    net_salary              DECIMAL(12,2),

    attendance_period_start DATE,
    attendance_period_end   DATE,
    days_worked             INTEGER DEFAULT 0,
    days_absent             INTEGER DEFAULT 0,
    biometric_hours_logged  DECIMAL(6,2) DEFAULT 0,

    payment_status          VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'calculated', 'approved', 'paid')),
    paid_at                 TIMESTAMPTZ,
    transaction_id          BIGINT REFERENCES public.transactions(id),

    payroll_month           INTEGER NOT NULL CHECK (payroll_month BETWEEN 1 AND 12),
    payroll_year            INTEGER NOT NULL,

    created_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(employee_id, payroll_month, payroll_year)
);

CREATE INDEX IF NOT EXISTS idx_govt_payroll_employee ON public.health_govt_payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_govt_payroll_hospital ON public.health_govt_payroll(hospital_id);
CREATE INDEX IF NOT EXISTS idx_govt_payroll_period ON public.health_govt_payroll(payroll_year, payroll_month);
CREATE INDEX IF NOT EXISTS idx_govt_payroll_status ON public.health_govt_payroll(payment_status);

-- ============================================================================
-- SECTION 12: SHA SERVICE CATALOG (Tariff Reference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_sha_service_catalog (
    id                  BIGSERIAL PRIMARY KEY,
    service_code        VARCHAR(50) UNIQUE NOT NULL,
    service_name        VARCHAR(255) NOT NULL,
    service_category    VARCHAR(100), -- "consultation", "procedure", "lab", "imaging", "pharmacy"
    description         TEXT,

    -- Pricing by hospital level
    price_level_1       DECIMAL(10,2), -- Dispensary
    price_level_2       DECIMAL(10,2), -- Health Center
    price_level_3       DECIMAL(10,2), -- Subcounty
    price_level_4       DECIMAL(10,2), -- County Referral
    price_level_5       DECIMAL(10,2), -- National Referral
    price_private       DECIMAL(10,2), -- Private hospitals

    is_active           BOOLEAN DEFAULT true,
    effective_from      DATE DEFAULT CURRENT_DATE,
    effective_to        DATE,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sha_catalog_code ON public.health_sha_service_catalog(service_code);
CREATE INDEX IF NOT EXISTS idx_sha_catalog_category ON public.health_sha_service_catalog(service_category);
CREATE INDEX IF NOT EXISTS idx_sha_catalog_active ON public.health_sha_service_catalog(is_active) WHERE is_active = true;

-- ============================================================================
-- SECTION 13: TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'health_hospitals',
        'health_departments', 
        'health_doctors',
        'health_doctor_hospitals',
        'health_patient_queues',
        'health_ehr_records',
        'health_sha_claims',
        'health_sha_fund_pools',
        'health_sha_contributors',
        'health_govt_payroll',
        'health_sha_service_catalog'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s', tbl, tbl);
            EXECUTE format('
                CREATE TRIGGER trg_%s_updated_at
                BEFORE UPDATE ON public.%s
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at_column()
            ', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- SECTION 14: AUTO-CALCULATE TOTAL_HOURS ON CLOCK-OUT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_attendance_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clock_out_at IS NOT NULL AND OLD.clock_out_at IS NULL THEN
        NEW.total_hours = ROUND(
            EXTRACT(EPOCH FROM (NEW.clock_out_at - NEW.clock_in_at)) / 3600, 
            2
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_biometric_calculate_hours ON public.health_biometric_attendance;
CREATE TRIGGER trg_biometric_calculate_hours
    BEFORE UPDATE ON public.health_biometric_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_attendance_hours();

-- ============================================================================
-- SECTION 15: AUTO-GENERATE CLAIM NUMBER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_claim_number()
RETURNS TRIGGER AS $$
DECLARE
    year_str TEXT;
    next_num INTEGER;
BEGIN
    year_str := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(NULLIF(regexp_replace(claim_number, '[^0-9]', '', 'g'), '')::INTEGER), 0) + 1
    INTO next_num
    FROM public.health_sha_claims
    WHERE claim_number LIKE 'SHA-' || year_str || '-%';

    NEW.claim_number := 'SHA-' || year_str || '-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sha_claims_number ON public.health_sha_claims;
CREATE TRIGGER trg_sha_claims_number
    BEFORE INSERT ON public.health_sha_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_claim_number();

-- ============================================================================
-- SECTION 16: RLS POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.health_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_doctor_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_biometric_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_patient_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_ehr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_sha_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_sha_fund_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_sha_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_govt_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_sha_service_catalog ENABLE ROW LEVEL SECURITY;

-- Hospitals: Public can view active hospitals
CREATE POLICY "Public can view active hospitals" 
ON public.health_hospitals FOR SELECT 
USING (status = 'active');

CREATE POLICY "Hospital admins can manage their hospital" 
ON public.health_hospitals FOR ALL 
USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.health_doctor_hospitals 
    WHERE hospital_id = health_hospitals.id 
    AND doctor_id IN (SELECT id FROM public.health_doctors WHERE user_id = auth.uid())
    AND role_at_hospital IN ('Admin', 'Head of Dept', 'Director')
));

-- Doctors: Public can view active doctors
CREATE POLICY "Public can view active doctors" 
ON public.health_doctors FOR SELECT 
USING (status = 'active');

CREATE POLICY "Doctors can manage their own profile" 
ON public.health_doctors FOR ALL 
USING (user_id = auth.uid());

-- Patient Queues: Patients see their own, hospitals see their queue
CREATE POLICY "Patients see their queue entries" 
ON public.health_patient_queues FOR SELECT 
USING (patient_id = auth.uid());

CREATE POLICY "Hospital staff see their hospital queues" 
ON public.health_patient_queues FOR ALL 
USING (hospital_id IN (
    SELECT hospital_id FROM public.health_doctor_hospitals 
    WHERE doctor_id IN (SELECT id FROM public.health_doctors WHERE user_id = auth.uid())
));

-- EHR: Patients own their records, treating doctors can view
CREATE POLICY "Patients own their health records" 
ON public.health_ehr_records FOR SELECT 
USING (patient_id = auth.uid());

CREATE POLICY "Treating doctors can view records" 
ON public.health_ehr_records FOR SELECT 
USING (
    doctor_id IN (SELECT id FROM public.health_doctors WHERE user_id = auth.uid())
    OR hospital_id IN (
        SELECT hospital_id FROM public.health_doctor_hospitals 
        WHERE doctor_id IN (SELECT id FROM public.health_doctors WHERE user_id = auth.uid())
    )
    OR auth.uid() = ANY(SELECT (jsonb_array_elements_text(access_granted_to))::UUID)
);

-- SHA Claims: Public view for transparency
CREATE POLICY "Public can view claims by hash" 
ON public.health_sha_claims FOR SELECT 
USING (is_public = true);

CREATE POLICY "Hospitals can view their claims" 
ON public.health_sha_claims FOR ALL 
USING (hospital_id IN (
    SELECT hospital_id FROM public.health_doctor_hospitals 
    WHERE doctor_id IN (SELECT id FROM public.health_doctors WHERE user_id = auth.uid())
));

-- SHA Fund Pools: Public view
CREATE POLICY "Public can view fund pools" 
ON public.health_sha_fund_pools FOR SELECT 
USING (public_dashboard_enabled = true);

-- Govt Payroll: Employees see their own
CREATE POLICY "Employees see their own payroll" 
ON public.health_govt_payroll FOR SELECT 
USING (employee_id = auth.uid());

CREATE POLICY "Hospital admins manage payroll" 
ON public.health_govt_payroll FOR ALL 
USING (hospital_id IN (
    SELECT hospital_id FROM public.health_doctor_hospitals 
    WHERE doctor_id IN (SELECT id FROM public.health_doctors WHERE user_id = auth.uid())
    AND role_at_hospital IN ('Admin', 'Director', 'HR Manager')
));

-- ============================================================================
-- SECTION 17: SEED DATA (Kenya SHA Starter)
-- ============================================================================

-- Insert default SHA Fund Pool for Kenya
INSERT INTO public.health_sha_fund_pools (pool_name, pool_code, coverage_type, covered_counties)
VALUES (
    'Kenya Social Health Authority National Pool',
    'KENYA-SHA-2026',
    'national',
    '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47]'
)
ON CONFLICT (pool_code) DO NOTHING;

-- Insert sample service catalog items
INSERT INTO public.health_sha_service_catalog (service_code, service_name, service_category, description, price_level_1, price_level_2, price_level_3, price_level_4, price_level_5, price_private)
VALUES 
    ('CONS001', 'General Consultation', 'consultation', 'Standard outpatient consultation with general practitioner', 200, 300, 400, 500, 600, 1000),
    ('CONS002', 'Specialist Consultation', 'consultation', 'Consultation with specialist (cardiologist, neurologist, etc.)', 300, 500, 700, 1000, 1500, 2500),
    ('LAB001', 'Complete Blood Count (CBC)', 'lab', 'Full blood count analysis', 150, 250, 350, 500, 700, 1200),
    ('LAB002', 'Malaria Rapid Test', 'lab', 'Rapid diagnostic test for malaria', 50, 100, 150, 200, 300, 500),
    ('IMG001', 'Chest X-Ray', 'imaging', 'Standard chest radiograph', 200, 400, 600, 1000, 1500, 2500),
    ('IMG002', 'Ultrasound', 'imaging', 'General abdominal ultrasound', 300, 500, 800, 1200, 2000, 3500),
    ('PROC001', 'Wound Dressing', 'procedure', 'Standard wound cleaning and dressing', 100, 150, 250, 400, 600, 1000),
    ('PROC002', 'Injection/Immunization', 'procedure', 'Intramuscular or subcutaneous injection', 50, 80, 120, 200, 300, 500),
    ('PHARM001', 'Amoxicillin 500mg (1 course)', 'pharmacy', 'Standard antibiotic course (21 capsules)', 150, 200, 300, 400, 500, 800),
    ('PHARM002', 'Paracetamol 500mg (1 pack)', 'pharmacy', 'Pain relief medication (100 tablets)', 50, 80, 120, 200, 300, 500)
ON CONFLICT (service_code) DO NOTHING;

-- ============================================================================
-- SECTION 18: VIEWS FOR DASHBOARDS
-- ============================================================================

-- Hospital Performance Dashboard View
CREATE OR REPLACE VIEW public.vw_hospital_performance AS
SELECT 
    h.id AS hospital_id,
    h.hospital_name,
    h.hospital_type,
    h.county_id,
    COUNT(DISTINCT pq.id) FILTER (WHERE pq.queue_status = 'completed' AND pq.visit_date = CURRENT_DATE) AS patients_seen_today,
    COUNT(DISTINCT ba.id) FILTER (WHERE ba.clock_in_at::date = CURRENT_DATE AND ba.clock_out_at IS NULL) AS doctors_on_duty,
    COALESCE(SUM(sc.total_claim_amount) FILTER (WHERE sc.payment_status = 'paid' AND sc.paid_at::date = CURRENT_DATE), 0) AS revenue_today,
    COUNT(DISTINCT sc.id) FILTER (WHERE sc.payment_status = 'pending') AS pending_claims,
    AVG(pq.actual_wait_minutes) FILTER (WHERE pq.consultation_ended_at IS NOT NULL AND pq.checked_in_at::date = CURRENT_DATE) AS avg_wait_time_today
FROM public.health_hospitals h
LEFT JOIN public.health_patient_queues pq ON pq.hospital_id = h.id
LEFT JOIN public.health_biometric_attendance ba ON ba.hospital_id = h.id
LEFT JOIN public.health_sha_claims sc ON sc.hospital_id = h.id
WHERE h.status = 'active'
GROUP BY h.id, h.hospital_name, h.hospital_type, h.county_id;

-- SHA Fund Transparency View
CREATE OR REPLACE VIEW public.vw_sha_transparency AS
SELECT 
    p.id AS pool_id,
    p.pool_name,
    p.pool_code,
    p.current_balance,
    p.total_contributions,
    p.total_paid_out,
    p.total_contributors,
    p.active_contributors,
    COUNT(DISTINCT sc.id) FILTER (WHERE sc.payment_status = 'paid') AS total_claims_paid,
    COALESCE(SUM(sc.total_claim_amount) FILTER (WHERE sc.payment_status = 'paid'), 0) AS total_claims_amount,
    COUNT(DISTINCT sc.id) FILTER (WHERE sc.payment_status = 'pending') AS pending_claims_count,
    COALESCE(SUM(sc.total_claim_amount) FILTER (WHERE sc.payment_status = 'pending'), 0) AS pending_claims_amount
FROM public.health_sha_fund_pools p
LEFT JOIN public.health_sha_claims sc ON sc.sha_fund_pool_id = p.id
WHERE p.pool_status = 'active'
GROUP BY p.id, p.pool_name, p.pool_code, p.current_balance, p.total_contributions, p.total_paid_out, p.total_contributors, p.active_contributors;

-- Doctor Attendance Summary View
CREATE OR REPLACE VIEW public.vw_doctor_attendance_summary AS
SELECT 
    d.id AS doctor_id,
    d.user_id,
    d.license_number,
    d.primary_specialty,
    dh.hospital_id,
    h.hospital_name,
    COUNT(ba.id) FILTER (WHERE ba.clock_in_at::date = CURRENT_DATE) AS clock_ins_today,
    SUM(ba.total_hours) FILTER (WHERE ba.clock_in_at::date >= DATE_TRUNC('month', CURRENT_DATE)) AS hours_this_month,
    COUNT(ba.id) FILTER (WHERE ba.clock_in_at::date >= DATE_TRUNC('month', CURRENT_DATE)) AS days_worked_this_month,
    AVG(ba.total_hours) FILTER (WHERE ba.clock_in_at::date >= DATE_TRUNC('month', CURRENT_DATE)) AS avg_hours_per_day
FROM public.health_doctors d
LEFT JOIN public.health_doctor_hospitals dh ON dh.doctor_id = d.id AND dh.is_active = true
LEFT JOIN public.health_hospitals h ON h.id = dh.hospital_id
LEFT JOIN public.health_biometric_attendance ba ON ba.doctor_id = d.id AND ba.hospital_id = dh.hospital_id
WHERE d.status = 'active'
GROUP BY d.id, d.user_id, d.license_number, d.primary_specialty, dh.hospital_id, h.hospital_name;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
SELECT 'MTAA HEALTH MODULE SCHEMA DEPLOYED SUCCESSFULLY' AS status;
