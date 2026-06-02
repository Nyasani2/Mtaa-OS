
-- ============================================
-- CIVIC v2 — PRISONS MODULE SCHEMA FIXES + NEW TABLES
-- ============================================
-- Fixes to existing tables (if needed):
--   prison_facilities: add station_wallet_id, is_active
--   prison_inmates: add intake_date, release_date, parole_status, behavior_score
--   prison_movements: add case_ref to metadata usage (already JSONB)
--   prison_visits: add check_in, check_out, visitor_photo_url
--   prison_wardens: add employee_number, shift, station_wallet_id
--
-- New tables:
--   prison_cells, prison_incidents, prison_parole_reviews, 
--   prison_staff_attendance, prison_payroll, prison_procurement

-- ============================================
-- ALTER EXISTING TABLES (safe — only adds columns)
-- ============================================

-- prison_facilities: add missing fields for wallet + status
ALTER TABLE prison_facilities 
  ADD COLUMN IF NOT EXISTS station_wallet_id TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS security_level TEXT DEFAULT 'medium' CHECK (security_level IN ('minimum','medium','maximum','supermax'));

-- prison_inmates: add fields for full lifecycle tracking
ALTER TABLE prison_inmates
  ADD COLUMN IF NOT EXISTS intake_date DATE,
  ADD COLUMN IF NOT EXISTS release_date DATE,
  ADD COLUMN IF NOT EXISTS parole_status TEXT DEFAULT 'not_eligible' CHECK (parole_status IN ('not_eligible','eligible','applied','reviewing','granted','denied')),
  ADD COLUMN IF NOT EXISTS behavior_score INTEGER DEFAULT 50 CHECK (behavior_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high','critical')),
  ADD COLUMN IF NOT EXISTS next_review_date DATE,
  ADD COLUMN IF NOT EXISTS education_programs TEXT[],
  ADD COLUMN IF NOT EXISTS work_assignment TEXT,
  ADD COLUMN IF NOT EXISTS disciplinary_actions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS good_behavior_credits INTEGER DEFAULT 0;

-- prison_visits: add check-in/out tracking
ALTER TABLE prison_visits
  ADD COLUMN IF NOT EXISTS check_in TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_out TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visitor_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS items_seized TEXT[],
  ADD COLUMN IF NOT EXISTS visit_type TEXT DEFAULT 'standard' CHECK (visit_type IN ('standard','legal','medical','conjugal','disciplinary'));

-- prison_wardens: add employee fields
ALTER TABLE prison_wardens
  ADD COLUMN IF NOT EXISTS employee_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS shift TEXT DEFAULT 'day' CHECK (shift IN ('day','night','rotating')),
  ADD COLUMN IF NOT EXISTS station_wallet_id TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS date_hired DATE,
  ADD COLUMN IF NOT EXISTS badge_number TEXT;

-- ============================================
-- NEW TABLE: PRISON CELLS
-- ============================================
CREATE TABLE IF NOT EXISTS prison_cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES prison_facilities(id) ON DELETE CASCADE,
    cell_block TEXT NOT NULL,
    cell_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 2,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    cell_type TEXT DEFAULT 'general' CHECK (cell_type IN ('general','solitary','medical','protective_custody','death_row','juvenile')),
    security_level TEXT DEFAULT 'medium' CHECK (security_level IN ('minimum','medium','maximum','supermax')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(facility_id, cell_block, cell_number)
);

-- ============================================
-- NEW TABLE: PRISON INCIDENTS
-- ============================================
CREATE TABLE IF NOT EXISTS prison_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES prison_facilities(id),
    inmate_id UUID REFERENCES prison_inmates(id),
    reported_by UUID REFERENCES prison_wardens(id),
    incident_type TEXT NOT NULL CHECK (incident_type IN ('assault','escape_attempt','contraband','self_harm','death','riot','property_damage','medical_emergency','other')),
    severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','moderate','major','critical')),
    description TEXT NOT NULL,
    location TEXT,
    witnesses TEXT[],
    actions_taken TEXT[],
    status TEXT DEFAULT 'open' CHECK (status IN ('open','under_investigation','resolved','closed')),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NEW TABLE: PRISON PAROLE REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS prison_parole_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inmate_id UUID NOT NULL REFERENCES prison_inmates(id) ON DELETE CASCADE,
    review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    review_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (review_type IN ('scheduled','early','mandatory','appeal')),
    board_members TEXT[],
    behavior_score INTEGER,
    work_performance TEXT,
    rehabilitation_notes TEXT,
    recommendation TEXT CHECK (recommendation IN ('grant','deny','defer','further_review')),
    decision TEXT CHECK (decision IN ('granted','denied','deferred','pending')),
    conditions TEXT[],
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NEW TABLE: PRISON STAFF ATTENDANCE
-- ============================================
CREATE TABLE IF NOT EXISTS prison_staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES prison_facilities(id),
    staff_type TEXT NOT NULL CHECK (staff_type IN ('warden','guard','medical','counselor','kitchen','maintenance','admin')),
    staff_id UUID NOT NULL,
    staff_name TEXT NOT NULL,
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    hours_worked DECIMAL(4,2),
    tower_id TEXT,
    cell_block_id TEXT,
    verified_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NEW TABLE: PRISON PAYROLL
-- ============================================
CREATE TABLE IF NOT EXISTS prison_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES prison_facilities(id),
    staff_id UUID NOT NULL,
    staff_name TEXT NOT NULL,
    staff_type TEXT NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    base_amount DECIMAL(12,2) NOT NULL,
    hazard_allowance DECIMAL(12,2) DEFAULT 0,
    overtime DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','disputed')),
    paid_date TIMESTAMPTZ,
    transaction_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NEW TABLE: PRISON PROCUREMENT
-- ============================================
CREATE TABLE IF NOT EXISTS prison_procurement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES prison_facilities(id),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('security_equipment','medical','food','uniforms','rehabilitation','maintenance','technology','furniture','vehicles')),
    quantity INT NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    vendor_name TEXT,
    urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low','normal','high','critical')),
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested','approved','ordered','delivered','rejected')),
    requested_by UUID,
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inmates_facility ON prison_inmates(facility_id);
CREATE INDEX IF NOT EXISTS idx_inmates_status ON prison_inmates(status);
CREATE INDEX IF NOT EXISTS idx_inmates_parole ON prison_inmates(parole_status);
CREATE INDEX IF NOT EXISTS idx_cells_facility ON prison_cells(facility_id);
CREATE INDEX IF NOT EXISTS idx_cells_block ON prison_cells(cell_block);
CREATE INDEX IF NOT EXISTS idx_incidents_facility ON prison_incidents(facility_id);
CREATE INDEX IF NOT EXISTS idx_incidents_inmate ON prison_incidents(inmate_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON prison_incidents(status);
CREATE INDEX IF NOT EXISTS idx_parole_inmate ON prison_parole_reviews(inmate_id);
CREATE INDEX IF NOT EXISTS idx_parole_date ON prison_parole_reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_visits_inmate ON prison_visits(inmate_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON prison_visits(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_movements_inmate ON prison_movements(inmate_id);
CREATE INDEX IF NOT EXISTS idx_movements_from ON prison_movements(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_movements_to ON prison_movements(to_facility_id);
CREATE INDEX IF NOT EXISTS idx_wardens_facility ON prison_wardens(facility_id);
CREATE INDEX IF NOT EXISTS idx_prison_attendance_date ON prison_staff_attendance(shift_date);
CREATE INDEX IF NOT EXISTS idx_prison_payroll_period ON prison_payroll(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_prison_procurement_status ON prison_procurement(status);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE prison_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE prison_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prison_parole_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE prison_staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE prison_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE prison_procurement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prison_read_all" ON prison_cells FOR SELECT TO authenticated USING (true);
CREATE POLICY "prison_read_all" ON prison_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "prison_read_all" ON prison_parole_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "prison_read_all" ON prison_staff_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "prison_read_all" ON prison_payroll FOR SELECT TO authenticated USING (true);
CREATE POLICY "prison_read_all" ON prison_procurement FOR SELECT TO authenticated USING (true);

CREATE POLICY "prison_write_all" ON prison_cells FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "prison_write_all" ON prison_incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "prison_write_all" ON prison_parole_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "prison_write_all" ON prison_staff_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "prison_write_all" ON prison_payroll FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "prison_write_all" ON prison_procurement FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update cell occupancy when inmate assigned
CREATE OR REPLACE FUNCTION trg_update_cell_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.cell_block IS NOT NULL AND NEW.cell_number IS NOT NULL THEN
        UPDATE prison_cells 
        SET current_occupancy = current_occupancy + 1
        WHERE facility_id = NEW.facility_id AND cell_block = NEW.cell_block AND cell_number = NEW.cell_number;
    ELSIF TG_OP = 'UPDATE' AND OLD.cell_block IS DISTINCT FROM NEW.cell_block OR OLD.cell_number IS DISTINCT FROM NEW.cell_number THEN
        IF OLD.cell_block IS NOT NULL AND OLD.cell_number IS NOT NULL THEN
            UPDATE prison_cells 
            SET current_occupancy = GREATEST(current_occupancy - 1, 0)
            WHERE facility_id = OLD.facility_id AND cell_block = OLD.cell_block AND cell_number = OLD.cell_number;
        END IF;
        IF NEW.cell_block IS NOT NULL AND NEW.cell_number IS NOT NULL THEN
            UPDATE prison_cells 
            SET current_occupancy = current_occupancy + 1
            WHERE facility_id = NEW.facility_id AND cell_block = NEW.cell_block AND cell_number = NEW.cell_number;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.cell_block IS NOT NULL AND OLD.cell_number IS NOT NULL THEN
        UPDATE prison_cells 
        SET current_occupancy = GREATEST(current_occupancy - 1, 0)
        WHERE facility_id = OLD.facility_id AND cell_block = OLD.cell_block AND cell_number = OLD.cell_number;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cell_occupancy ON prison_inmates;
CREATE TRIGGER update_cell_occupancy
    AFTER INSERT OR UPDATE OR DELETE ON prison_inmates
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_cell_occupancy();

-- Auto-set intake_date on new inmate
CREATE OR REPLACE FUNCTION trg_set_intake_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.intake_date IS NULL THEN
        NEW.intake_date = CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_intake_date ON prison_inmates;
CREATE TRIGGER set_intake_date
    BEFORE INSERT ON prison_inmates
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_intake_date();

-- Auto-calculate sentence_end from sentence_start + sentence_length_months
CREATE OR REPLACE FUNCTION trg_calculate_sentence_end()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sentence_start IS NOT NULL AND NEW.sentence_length_months IS NOT NULL AND NEW.sentence_end IS NULL THEN
        NEW.sentence_end = NEW.sentence_start + (NEW.sentence_length_months || ' months')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_sentence_end ON prison_inmates;
CREATE TRIGGER calculate_sentence_end
    BEFORE INSERT OR UPDATE ON prison_inmates
    FOR EACH ROW
    EXECUTE FUNCTION trg_calculate_sentence_end();

-- Auto-set parole_eligible_date (half sentence for good behavior, 2/3 for standard)
CREATE OR REPLACE FUNCTION trg_set_parole_eligible()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sentence_start IS NOT NULL AND NEW.sentence_length_months IS NOT NULL THEN
        NEW.parole_eligible_date = NEW.sentence_start + ((NEW.sentence_length_months / 2) || ' months')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_parole_eligible ON prison_inmates;
CREATE TRIGGER set_parole_eligible
    BEFORE INSERT OR UPDATE ON prison_inmates
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_parole_eligible();

-- Auto-update parole_status when eligible date reached
CREATE OR REPLACE FUNCTION trg_check_parole_eligibility()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parole_eligible_date IS NOT NULL AND NEW.parole_eligible_date <= CURRENT_DATE AND NEW.parole_status = 'not_eligible' THEN
        NEW.parole_status = 'eligible';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_parole_eligibility ON prison_inmates;
CREATE TRIGGER check_parole_eligibility
    BEFORE UPDATE ON prison_inmates
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_parole_eligibility();

-- Auto-log movement when inmate status changes to 'transferred' or 'released'
CREATE OR REPLACE FUNCTION trg_inmate_status_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'transferred' AND OLD.status != 'transferred' THEN
        INSERT INTO prison_movements (inmate_id, from_facility_id, to_facility_id, movement_type, reason, occurred_at, created_at)
        VALUES (NEW.id, NEW.facility_id, NULL, 'transfer_out', 'Inmate transferred out', now(), now());
    ELSIF NEW.status = 'released' AND OLD.status != 'released' THEN
        INSERT INTO prison_movements (inmate_id, from_facility_id, to_facility_id, movement_type, reason, occurred_at, created_at)
        VALUES (NEW.id, NEW.facility_id, NULL, 'release', 'Inmate released', now(), now());
        NEW.release_date = CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inmate_status_movement ON prison_inmates;
CREATE TRIGGER inmate_status_movement
    AFTER UPDATE ON prison_inmates
    FOR EACH ROW
    EXECUTE FUNCTION trg_inmate_status_movement();

-- Auto-create parole review when status changes to 'eligible'
CREATE OR REPLACE FUNCTION trg_auto_parole_review()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parole_status = 'eligible' AND OLD.parole_status != 'eligible' THEN
        INSERT INTO prison_parole_reviews (inmate_id, review_date, review_type, decision, created_at)
        VALUES (NEW.id, CURRENT_DATE + INTERVAL '30 days', 'scheduled', 'pending', now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_parole_review ON prison_inmates;
CREATE TRIGGER auto_parole_review
    AFTER UPDATE ON prison_inmates
    FOR EACH ROW
    EXECUTE FUNCTION trg_auto_parole_review();

-- ============================================
-- SEED DATA (sample cells for existing facilities)
-- ============================================
INSERT INTO prison_cells (facility_id, cell_block, cell_number, capacity, cell_type, security_level)
SELECT 
    id as facility_id,
    'BLOCK-A',
    '001',
    4,
    'general',
    'medium'
FROM prison_facilities
ON CONFLICT DO NOTHING;

INSERT INTO prison_cells (facility_id, cell_block, cell_number, capacity, cell_type, security_level)
SELECT 
    id as facility_id,
    'BLOCK-B',
    '101',
    2,
    'solitary',
    'maximum'
FROM prison_facilities
ON CONFLICT DO NOTHING;
