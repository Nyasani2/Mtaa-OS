-- ============================================================
-- PHASE C5: WALKING SQUAD — Parent Duty Roster + Streets Integration
-- Children who walk to school or to the PSV stage
-- ============================================================

-- 1. Walking Squads (neighbourhood groups of walking children)
CREATE TABLE IF NOT EXISTS education_walking_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES education_schools(id) ON DELETE CASCADE,
  squad_name TEXT NOT NULL,
  squad_code TEXT UNIQUE NOT NULL, -- e.g. "WS-001-NRB"

  -- Meeting point (Street Corner from MTAA Streets)
  meeting_point_name TEXT NOT NULL, -- e.g. "Mtaa Street Corner, Block 7"
  meeting_point_lat DECIMAL(10, 8),
  meeting_point_lng DECIMAL(11, 8),
  meeting_time TIME NOT NULL DEFAULT '07:30:00',

  -- Squad composition
  max_children INTEGER NOT NULL DEFAULT 8,
  current_children INTEGER NOT NULL DEFAULT 0,
  age_range_min INTEGER,
  age_range_max INTEGER,

  -- Route: walking or stage handoff
  route_type TEXT NOT NULL DEFAULT 'walk_to_school' CHECK (route_type IN ('walk_to_school', 'walk_to_stage', 'mixed')),
  is_psv_handoff BOOLEAN NOT NULL DEFAULT false,
  psv_stage_name TEXT, -- e.g. "Kangemi Stage"
  psv_stage_lat DECIMAL(10, 8),
  psv_stage_lng DECIMAL(11, 8),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'disbanded')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_walking_squads_school ON education_walking_squads(school_id);
CREATE INDEX idx_walking_squads_status ON education_walking_squads(status) WHERE status = 'active';
CREATE INDEX idx_walking_squads_route ON education_walking_squads(route_type);

-- 2. Parent Duty Roster (who walks the squad on which day)
CREATE TABLE IF NOT EXISTS education_parent_duty_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES education_walking_squads(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES education_parents(id) ON DELETE CASCADE,

  duty_date DATE NOT NULL,
  duty_type TEXT NOT NULL DEFAULT 'morning' CHECK (duty_type IN ('morning', 'evening', 'both', 'backup')),
  -- Morning duty: walk children TO school/stage
  -- Evening duty: walk children FROM school/stage
  -- Both: full day escort
  -- Backup: on-call if primary parent is absent

  -- Handoff chain
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- QR code for duty parent identification
  duty_qr_code TEXT UNIQUE,

  -- Check-in/check-out
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  check_in_lat DECIMAL(10, 8),
  check_in_lng DECIMAL(11, 8),
  check_out_lat DECIMAL(10, 8),
  check_out_lng DECIMAL(11, 8),

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'on_duty', 'handed_over', 'checked_out', 'completed', 'no_show', 'cancelled')),

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_parent_duty_per_day UNIQUE (squad_id, parent_id, duty_date, duty_type)
);

CREATE INDEX idx_duty_roster_squad ON education_parent_duty_roster(squad_id);
CREATE INDEX idx_duty_roster_parent ON education_parent_duty_roster(parent_id);
CREATE INDEX idx_duty_roster_date ON education_parent_duty_roster(duty_date);
CREATE INDEX idx_duty_roster_status ON education_parent_duty_roster(status);
CREATE INDEX idx_duty_roster_today ON education_parent_duty_roster(duty_date, status) WHERE status IN ('scheduled', 'confirmed', 'checked_in', 'on_duty', 'handed_over');

-- 3. Walking Squad Children (which children are in which squad)
CREATE TABLE IF NOT EXISTS education_walking_squad_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES education_walking_squads(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,

  -- Child's home location (from Streets geofence)
  home_lat DECIMAL(10, 8),
  home_lng DECIMAL(11, 8),
  home_address TEXT,
  distance_to_meeting_point_meters INTEGER, -- auto-calculated from Streets

  -- Walking preferences
  needs_escort BOOLEAN NOT NULL DEFAULT true, -- always true for under 8
  can_walk_alone BOOLEAN NOT NULL DEFAULT false, -- only for 12+
  special_needs TEXT, -- e.g. "wheelchair", "visual_impairment"

  -- Parent consent
  parent_consent_signed BOOLEAN NOT NULL DEFAULT false,
  consent_signed_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,

  CONSTRAINT unique_student_squad UNIQUE (squad_id, student_id)
);

CREATE INDEX idx_squad_children_squad ON education_walking_squad_children(squad_id);
CREATE INDEX idx_squad_children_student ON education_walking_squad_children(student_id);
CREATE INDEX idx_squad_children_active ON education_walking_squad_children(is_active) WHERE is_active = true;

-- 4. Walking Handoff Scans (QR + fingerprint chain for walking children)
CREATE TABLE IF NOT EXISTS education_walking_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Chain participants
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES education_walking_squads(id) ON DELETE CASCADE,
  duty_roster_id UUID NOT NULL REFERENCES education_parent_duty_roster(id) ON DELETE CASCADE,

  -- Handoff type
  handoff_type TEXT NOT NULL CHECK (handoff_type IN (
    'parent_to_duty_parent',      -- Parent drops to duty parent at meeting point
    'duty_parent_to_teacher',     -- Duty parent walks to school, hands to teacher
    'duty_parent_to_psv',         -- Duty parent walks to stage, hands to PSV
    'teacher_to_duty_parent',     -- Teacher hands to duty parent for walk home
    'psv_to_duty_parent',         -- PSV drops at stage, duty parent receives
    'duty_parent_to_parent'       -- Duty parent returns child to parent at meeting point
  )),

  -- Who hands over (FROM)
  from_parent_id UUID REFERENCES education_parents(id) ON DELETE SET NULL,
  from_teacher_id UUID REFERENCES education_teachers(id) ON DELETE SET NULL,
  from_psv_driver_id UUID, -- references mtaxi_drivers

  -- Who receives (TO)
  to_parent_duty_id UUID REFERENCES education_parent_duty_roster(id) ON DELETE SET NULL,
  to_teacher_id UUID REFERENCES education_teachers(id) ON DELETE SET NULL,
  to_psv_driver_id UUID, -- references mtaxi_drivers

  -- Scan data
  from_qr_scanned BOOLEAN NOT NULL DEFAULT false,
  from_fingerprint_verified BOOLEAN NOT NULL DEFAULT false,
  to_qr_scanned BOOLEAN NOT NULL DEFAULT false,
  to_fingerprint_verified BOOLEAN NOT NULL DEFAULT false,
  child_qr_scanned BOOLEAN NOT NULL DEFAULT false,

  -- GPS at handoff
  handoff_lat DECIMAL(10, 8),
  handoff_lng DECIMAL(11, 8),

  -- Timestamps
  scheduled_time TIMESTAMPTZ,
  actual_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'from_confirmed', 'to_confirmed', 'complete', 'anomaly')),

  -- Anomaly tracking
  anomaly_flag BOOLEAN NOT NULL DEFAULT false,
  anomaly_reason TEXT,
  anomaly_resolved_at TIMESTAMPTZ,
  anomaly_resolved_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_handoffs_student ON education_walking_handoffs(student_id);
CREATE INDEX idx_handoffs_squad ON education_walking_handoffs(squad_id);
CREATE INDEX idx_handoffs_duty ON education_walking_handoffs(duty_roster_id);
CREATE INDEX idx_handoffs_type ON education_walking_handoffs(handoff_type);
CREATE INDEX idx_handoffs_status ON education_walking_handoffs(status);
CREATE INDEX idx_handoffs_anomaly ON education_walking_handoffs(anomaly_flag) WHERE anomaly_flag = true;

-- 5. Walking Tracking (live GPS breadcrumb of duty parent + children)
CREATE TABLE IF NOT EXISTS education_walking_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES education_walking_squads(id) ON DELETE CASCADE,
  duty_roster_id UUID NOT NULL REFERENCES education_parent_duty_roster(id) ON DELETE CASCADE,

  -- GPS breadcrumb
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  accuracy_meters INTEGER,
  speed_kmh DECIMAL(4, 1),

  -- Proximity to route
  is_on_route BOOLEAN NOT NULL DEFAULT true,
  deviation_meters INTEGER,
  nearest_landmark TEXT,

  -- Children with duty parent (array of student IDs)
  children_present UUID[] DEFAULT '{}',
  children_count INTEGER NOT NULL DEFAULT 0,

  -- Status
  tracking_status TEXT NOT NULL DEFAULT 'walking' CHECK (tracking_status IN ('walking', 'stopped', 'at_school', 'at_stage', 'at_meeting_point', 'emergency')),

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracking_squad ON education_walking_tracking(squad_id);
CREATE INDEX idx_tracking_duty ON education_walking_tracking(duty_roster_id);
CREATE INDEX idx_tracking_time ON education_walking_tracking(recorded_at DESC);
CREATE INDEX idx_tracking_status ON education_walking_tracking(tracking_status);

-- ============================================================
-- AUTO-TRIGGERS
-- ============================================================

-- Trigger 1: Auto-update squad child count
CREATE OR REPLACE FUNCTION update_squad_child_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE education_walking_squads
  SET current_children = (
    SELECT COUNT(*) FROM education_walking_squad_children
    WHERE squad_id = COALESCE(NEW.squad_id, OLD.squad_id)
    AND is_active = true
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.squad_id, OLD.squad_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_squad_count ON education_walking_squad_children;
CREATE TRIGGER trg_squad_count
AFTER INSERT OR UPDATE OR DELETE ON education_walking_squad_children
FOR EACH ROW EXECUTE FUNCTION update_squad_child_count();

-- Trigger 2: Auto-generate duty QR code
CREATE OR REPLACE FUNCTION generate_duty_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.duty_qr_code := 'DUTY-' || NEW.squad_id::TEXT || '-' || NEW.parent_id::TEXT || '-' || TO_CHAR(NEW.duty_date, 'YYYYMMDD') || '-' || NEW.duty_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_duty_qr ON education_parent_duty_roster;
CREATE TRIGGER trg_duty_qr
BEFORE INSERT ON education_parent_duty_roster
FOR EACH ROW EXECUTE FUNCTION generate_duty_qr_code();

-- Trigger 3: Auto-flag anomaly if handoff incomplete
CREATE OR REPLACE FUNCTION check_handoff_anomaly()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'complete' THEN
    IF NOT (NEW.from_qr_scanned AND NEW.to_qr_scanned AND NEW.child_qr_scanned) THEN
      NEW.anomaly_flag := true;
      NEW.anomaly_reason := 'Missing required QR scan in handoff chain';
      NEW.status := 'anomaly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handoff_anomaly ON education_walking_handoffs;
CREATE TRIGGER trg_handoff_anomaly
BEFORE UPDATE ON education_walking_handoffs
FOR EACH ROW EXECUTE FUNCTION check_handoff_anomaly();

-- Trigger 4: Auto-notify parent when duty parent checks in
CREATE OR REPLACE FUNCTION notify_parent_duty_checkin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'checked_in' AND OLD.status != 'checked_in' THEN
    INSERT INTO education_parent_notifications (parent_id, notification_type, title, message, metadata)
    SELECT 
      wsc.student_id,
      'walking_duty_checkin',
      'Walking Squad Duty Parent Checked In',
      'The duty parent for ' || ws.squad_name || ' has checked in at the meeting point. Your child is in safe hands.',
      jsonb_build_object(
        'squad_id', NEW.squad_id,
        'duty_roster_id', NEW.id,
        'parent_id', NEW.parent_id,
        'check_in_time', NEW.check_in_at
      )
    FROM education_walking_squad_children wsc
    JOIN education_walking_squads ws ON ws.id = wsc.squad_id
    WHERE wsc.squad_id = NEW.squad_id AND wsc.is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_duty_checkin_notify ON education_parent_duty_roster;
CREATE TRIGGER trg_duty_checkin_notify
AFTER UPDATE ON education_parent_duty_roster
FOR EACH ROW EXECUTE FUNCTION notify_parent_duty_checkin();

-- Trigger 5: Auto-notify parent on handoff completion
CREATE OR REPLACE FUNCTION notify_parent_handoff_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_handoff_type TEXT;
BEGIN
  IF NEW.status = 'complete' AND OLD.status != 'complete' THEN
    SELECT guardian_id INTO v_parent_id FROM education_students WHERE id = NEW.student_id;

    v_handoff_type := CASE NEW.handoff_type
      WHEN 'parent_to_duty_parent' THEN 'Your child has been handed to the duty parent'
      WHEN 'duty_parent_to_teacher' THEN 'Your child has arrived safely at school'
      WHEN 'duty_parent_to_psv' THEN 'Your child has been handed to the PSV driver at the stage'
      WHEN 'teacher_to_duty_parent' THEN 'Your child has been collected from school by the duty parent'
      WHEN 'psv_to_duty_parent' THEN 'Your child has been collected from the stage by the duty parent'
      WHEN 'duty_parent_to_parent' THEN 'Your child has been returned to you by the duty parent'
      ELSE 'Handoff complete'
    END;

    INSERT INTO education_parent_notifications (parent_id, notification_type, title, message, metadata)
    VALUES (
      v_parent_id,
      'walking_handoff_complete',
      'Walking Squad Handoff Complete',
      v_handoff_type,
      jsonb_build_object(
        'handoff_id', NEW.id,
        'student_id', NEW.student_id,
        'squad_id', NEW.squad_id,
        'handoff_type', NEW.handoff_type,
        'actual_time', NEW.actual_time
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handoff_notify ON education_walking_handoffs;
CREATE TRIGGER trg_handoff_notify
AFTER UPDATE ON education_walking_handoffs
FOR EACH ROW EXECUTE FUNCTION notify_parent_handoff_complete();

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE education_walking_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_parent_duty_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_walking_squad_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_walking_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_walking_tracking ENABLE ROW LEVEL SECURITY;

-- Walking Squads
CREATE POLICY ws_school_admin ON education_walking_squads
  FOR ALL USING (EXISTS (SELECT 1 FROM education_schools WHERE id = school_id AND admin_id = auth.uid()));
CREATE POLICY ws_parent ON education_walking_squads
  FOR SELECT USING (EXISTS (SELECT 1 FROM education_walking_squad_children wsc JOIN education_students s ON s.id = wsc.student_id WHERE wsc.squad_id = education_walking_squads.id AND s.guardian_id = auth.uid()));

-- Duty Roster
CREATE POLICY dr_school_admin ON education_parent_duty_roster
  FOR ALL USING (EXISTS (SELECT 1 FROM education_walking_squads ws JOIN education_schools s ON s.id = ws.school_id WHERE ws.id = squad_id AND s.admin_id = auth.uid()));
CREATE POLICY dr_parent ON education_parent_duty_roster
  FOR ALL USING (parent_id = auth.uid() OR EXISTS (SELECT 1 FROM education_walking_squad_children wsc JOIN education_students s ON s.id = wsc.student_id WHERE wsc.squad_id = education_parent_duty_roster.squad_id AND s.guardian_id = auth.uid()));

-- Squad Children
CREATE POLICY sc_school_admin ON education_walking_squad_children
  FOR ALL USING (EXISTS (SELECT 1 FROM education_walking_squads ws JOIN education_schools s ON s.id = ws.school_id WHERE ws.id = squad_id AND s.admin_id = auth.uid()));
CREATE POLICY sc_parent ON education_walking_squad_children
  FOR ALL USING (EXISTS (SELECT 1 FROM education_students WHERE id = student_id AND guardian_id = auth.uid()));

-- Handoffs
CREATE POLICY wh_school_admin ON education_walking_handoffs
  FOR ALL USING (EXISTS (SELECT 1 FROM education_walking_squads ws JOIN education_schools s ON s.id = ws.school_id WHERE ws.id = squad_id AND s.admin_id = auth.uid()));
CREATE POLICY wh_parent ON education_walking_handoffs
  FOR ALL USING (EXISTS (SELECT 1 FROM education_students WHERE id = student_id AND guardian_id = auth.uid()));
CREATE POLICY wh_duty_parent ON education_walking_handoffs
  FOR ALL USING (EXISTS (SELECT 1 FROM education_parent_duty_roster WHERE id = duty_roster_id AND parent_id = auth.uid()));

-- Tracking
CREATE POLICY wt_school_admin ON education_walking_tracking
  FOR ALL USING (EXISTS (SELECT 1 FROM education_walking_squads ws JOIN education_schools s ON s.id = ws.school_id WHERE ws.id = squad_id AND s.admin_id = auth.uid()));
CREATE POLICY wt_parent ON education_walking_tracking
  FOR SELECT USING (EXISTS (SELECT 1 FROM education_walking_squad_children WHERE squad_id = education_walking_tracking.squad_id AND EXISTS (SELECT 1 FROM education_students WHERE id = student_id AND guardian_id = auth.uid())));
CREATE POLICY wt_duty_parent ON education_walking_tracking
  FOR ALL USING (EXISTS (SELECT 1 FROM education_parent_duty_roster WHERE id = duty_roster_id AND parent_id = auth.uid()));

-- ============================================================
-- REALTIME
-- ============================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE education_walking_squads;
ALTER PUBLICATION supabase_realtime ADD TABLE education_parent_duty_roster;
ALTER PUBLICATION supabase_realtime ADD TABLE education_walking_squad_children;
ALTER PUBLICATION supabase_realtime ADD TABLE education_walking_handoffs;
ALTER PUBLICATION supabase_realtime ADD TABLE education_walking_tracking;
