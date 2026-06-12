-- ============================================================
-- PHASE C3: TRANSPORT — CHILD SAFETY CHAIN OF CUSTODY
-- 4 tables: routes, transport_students, transport_scans, transport_anomalies
-- Integrates with: mtaxi_drivers, mtaxi_vehicles, mtaxi_trips, education_classes, profiles
-- ============================================================

-- ============================================================
-- TABLE 1: education_transport_routes
-- Route definitions with stops and geofences
-- ============================================================
CREATE TABLE IF NOT EXISTS education_transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES education_schools(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  route_code TEXT NOT NULL,
  description TEXT,

  -- PSV Assignment
  psv_driver_id UUID REFERENCES mtaxi_drivers(id) ON DELETE SET NULL,
  psv_vehicle_id UUID REFERENCES mtaxi_vehicles(id) ON DELETE SET NULL,

  -- Route Geometry (array of lat/lng stops)
  stops JSONB NOT NULL DEFAULT '[]',
  -- [{"name":"Stop A","lat":-1.29,"lng":36.82,"order":1,"type":"pickup"}, ...]

  -- Geofence for school (auto-detect arrival)
  school_geofence JSONB DEFAULT '{"lat":0,"lng":0,"radius_meters":100}',

  -- Schedule
  active_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  -- 0=Sun, 1=Mon, ... 6=Sat
  morning_pickup_time TIME,
  afternoon_dropoff_time TIME,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),

  -- Capacity
  max_students INTEGER NOT NULL DEFAULT 14,
  current_student_count INTEGER NOT NULL DEFAULT 0,

  -- Registration fee (parent pays to activate)
  registration_fee DECIMAL(10,2) DEFAULT 0.00,
  monthly_fee DECIMAL(10,2) DEFAULT 0.00,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  UNIQUE(school_id, route_code)
);

-- ============================================================
-- TABLE 2: education_transport_students
-- Child ↔ Route ↔ PSV assignment with parent payment tracking
-- Universal Africa Child Registration
-- ============================================================
CREATE TABLE IF NOT EXISTS education_transport_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Child Identity (universal registry)
  child_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Route Assignment
  route_id UUID NOT NULL REFERENCES education_transport_routes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES education_schools(id) ON DELETE CASCADE,

  -- PSV Details (denormalized for quick parent view)
  psv_driver_id UUID REFERENCES mtaxi_drivers(id) ON DELETE SET NULL,
  psv_vehicle_id UUID REFERENCES mtaxi_vehicles(id) ON DELETE SET NULL,
  psv_driver_name TEXT,
  psv_vehicle_plate TEXT,
  psv_vehicle_color TEXT,

  -- Home Pickup Location
  home_lat DECIMAL(10,8),
  home_lng DECIMAL(11,8),
  home_address TEXT,

  -- Pickup/Dropoff Stop Assignment
  pickup_stop_order INTEGER DEFAULT 1,
  dropoff_stop_order INTEGER DEFAULT 1,

  -- Payment Status
  registration_paid BOOLEAN NOT NULL DEFAULT FALSE,
  registration_paid_at TIMESTAMPTZ,
  registration_payment_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,

  monthly_paid BOOLEAN NOT NULL DEFAULT FALSE,
  monthly_paid_at TIMESTAMPTZ,
  monthly_payment_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,

  -- Chain of Custody Status
  custody_status TEXT NOT NULL DEFAULT 'home' 
    CHECK (custody_status IN ('home','with_house_girl','in_psv','at_school','missing','anomaly')),

  -- Live Tracking
  last_known_lat DECIMAL(10,8),
  last_known_lng DECIMAL(11,8),
  last_known_at TIMESTAMPTZ,
  last_scan_id UUID,

  -- Safety
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_notes TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(child_id, route_id)
);

-- ============================================================
-- TABLE 3: education_transport_scans
-- Every QR + Fingerprint scan in the custody chain
-- Immutable audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS education_transport_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who was scanned
  child_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  transport_student_id UUID NOT NULL REFERENCES education_transport_students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES education_transport_routes(id) ON DELETE CASCADE,

  -- Who did the scanning
  scanned_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scanned_by_role TEXT NOT NULL CHECK (scanned_by_role IN ('parent','house_girl','psv_driver','teacher','school_admin','system')),
  scanned_by_name TEXT,

  -- Scan Type
  scan_type TEXT NOT NULL CHECK (scan_type IN (
    'parent_handoff',        -- Parent gives child to house girl/PSV
    'house_girl_receive',    -- House girl receives from parent
    'house_girl_handoff',    -- House girl gives to PSV
    'psv_pickup',            -- PSV driver picks up child
    'psv_school_arrival',    -- PSV arrives at school, scans school QR
    'teacher_receive',       -- Teacher receives from PSV
    'teacher_attendance',    -- Teacher marks attendance
    'parent_receive',        -- Parent receives child back
    'anomaly_check'          -- System-triggered verification scan
  )),

  -- Verification
  qr_code_hash TEXT NOT NULL,
  fingerprint_verified BOOLEAN NOT NULL DEFAULT FALSE,
  fingerprint_hash TEXT,

  -- GPS at time of scan
  scan_lat DECIMAL(10,8),
  scan_lng DECIMAL(11,8),
  scan_accuracy_meters DECIMAL(6,2),

  -- Geofence validation
  expected_location_lat DECIMAL(10,8),
  expected_location_lng DECIMAL(11,8),
  location_deviation_meters DECIMAL(6,2),
  location_valid BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamp
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Device
  device_id TEXT,
  app_version TEXT,

  -- Anomaly flag
  is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
  anomaly_reason TEXT,

  -- Next expected scan
  next_expected_scan_type TEXT,
  next_expected_by TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE 4: education_transport_anomalies
-- Auto-detected and manually flagged anomalies
-- ============================================================
CREATE TABLE IF NOT EXISTS education_transport_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who
  child_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  transport_student_id UUID NOT NULL REFERENCES education_transport_students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES education_transport_routes(id) ON DELETE CASCADE,

  -- What
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'missing_scan',           -- Expected scan didn't happen
    'wrong_location',         -- Scan at wrong geofence
    'fingerprint_mismatch',   -- FP didn't match scanner
    'time_gap',               -- Too long between scans
    'route_deviation',        -- PSV off route (GPS)
    'unauthorized_scanner',   -- Unknown person scanning
    'custody_break',          -- Chain broken (child disappeared)
    'late_arrival',           -- PSV arrived late
    'no_show',                -- Child not picked up
    'wrong_child',            -- Wrong child scanned
    'system_alert'            -- Auto-detected by kernel
  )),

  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),

  -- Details
  description TEXT NOT NULL,
  related_scan_id UUID REFERENCES education_transport_scans(id) ON DELETE SET NULL,

  -- GPS
  detected_lat DECIMAL(10,8),
  detected_lng DECIMAL(11,8),

  -- Resolution
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','escalated')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,

  -- Notifications sent
  parent_notified BOOLEAN NOT NULL DEFAULT FALSE,
  parent_notified_at TIMESTAMPTZ,
  school_notified BOOLEAN NOT NULL DEFAULT FALSE,
  school_notified_at TIMESTAMPTZ,
  authorities_notified BOOLEAN NOT NULL DEFAULT FALSE,
  authorities_notified_at TIMESTAMPTZ,

  -- Auto-close rules
  auto_escalate_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transport_routes_school ON education_transport_routes(school_id);
CREATE INDEX IF NOT EXISTS idx_transport_routes_status ON education_transport_routes(status);
CREATE INDEX IF NOT EXISTS idx_transport_routes_driver ON education_transport_routes(psv_driver_id);

CREATE INDEX IF NOT EXISTS idx_transport_students_child ON education_transport_students(child_id);
CREATE INDEX IF NOT EXISTS idx_transport_students_parent ON education_transport_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_transport_students_route ON education_transport_students(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_students_custody ON education_transport_students(custody_status);
CREATE INDEX IF NOT EXISTS idx_transport_students_active ON education_transport_students(is_active);

CREATE INDEX IF NOT EXISTS idx_transport_scans_child ON education_transport_scans(child_id);
CREATE INDEX IF NOT EXISTS idx_transport_scans_transport ON education_transport_scans(transport_student_id);
CREATE INDEX IF NOT EXISTS idx_transport_scans_route ON education_transport_scans(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_scans_type ON education_transport_scans(scan_type);
CREATE INDEX IF NOT EXISTS idx_transport_scans_anomaly ON education_transport_scans(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_transport_scans_time ON education_transport_scans(scanned_at);

CREATE INDEX IF NOT EXISTS idx_transport_anomalies_child ON education_transport_anomalies(child_id);
CREATE INDEX IF NOT EXISTS idx_transport_anomalies_route ON education_transport_anomalies(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_anomalies_status ON education_transport_anomalies(status);
CREATE INDEX IF NOT EXISTS idx_transport_anomalies_severity ON education_transport_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_transport_anomalies_created ON education_transport_anomalies(created_at);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- education_transport_routes
ALTER TABLE education_transport_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routes_school_admin_full" ON education_transport_routes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM education_school_staff 
      WHERE school_id = education_transport_routes.school_id 
      AND staff_id = auth.uid() 
      AND role IN ('admin','principal','transport_manager'))
  );

CREATE POLICY "routes_teacher_read" ON education_transport_routes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM education_school_staff 
      WHERE school_id = education_transport_routes.school_id 
      AND staff_id = auth.uid() 
      AND role IN ('teacher','admin','principal'))
  );

CREATE POLICY "routes_parent_read" ON education_transport_routes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM education_transport_students 
      WHERE route_id = education_transport_routes.id 
      AND parent_id = auth.uid())
  );

CREATE POLICY "routes_driver_read" ON education_transport_routes
  FOR SELECT USING (psv_driver_id = auth.uid());

-- education_transport_students
ALTER TABLE education_transport_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transport_students_parent_own" ON education_transport_students
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "transport_students_school_admin" ON education_transport_students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM education_school_staff 
      WHERE school_id = education_transport_students.school_id 
      AND staff_id = auth.uid() 
      AND role IN ('admin','principal','transport_manager'))
  );

CREATE POLICY "transport_students_teacher_read" ON education_transport_students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM education_school_staff 
      WHERE school_id = education_transport_students.school_id 
      AND staff_id = auth.uid() 
      AND role IN ('teacher','admin','principal'))
  );

CREATE POLICY "transport_students_driver_read" ON education_transport_students
  FOR SELECT USING (psv_driver_id = auth.uid());

-- education_transport_scans
ALTER TABLE education_transport_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scans_parent_own" ON education_transport_scans
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "scans_school_admin" ON education_transport_scans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM education_school_staff s
      JOIN education_transport_routes r ON r.school_id = s.school_id
      WHERE r.id = education_transport_scans.route_id
      AND s.staff_id = auth.uid()
      AND s.role IN ('admin','principal','transport_manager'))
  );

CREATE POLICY "scans_teacher_read" ON education_transport_scans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM education_school_staff s
      JOIN education_transport_routes r ON r.school_id = s.school_id
      WHERE r.id = education_transport_scans.route_id
      AND s.staff_id = auth.uid()
      AND s.role IN ('teacher','admin','principal'))
  );

CREATE POLICY "scans_driver_read" ON education_transport_scans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM education_transport_routes r
      WHERE r.id = education_transport_scans.route_id
      AND r.psv_driver_id = auth.uid())
  );

CREATE POLICY "scans_system_insert" ON education_transport_scans
  FOR INSERT WITH CHECK (scanned_by_role = 'system');

-- education_transport_anomalies
ALTER TABLE education_transport_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anomalies_parent_own" ON education_transport_anomalies
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "anomalies_school_admin" ON education_transport_anomalies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM education_school_staff s
      JOIN education_transport_routes r ON r.school_id = s.school_id
      WHERE r.id = education_transport_anomalies.route_id
      AND s.staff_id = auth.uid()
      AND s.role IN ('admin','principal','transport_manager'))
  );

CREATE POLICY "anomalies_teacher_read" ON education_transport_anomalies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM education_school_staff s
      JOIN education_transport_routes r ON r.school_id = s.school_id
      WHERE r.id = education_transport_anomalies.route_id
      AND s.staff_id = auth.uid()
      AND s.role IN ('teacher','admin','principal'))
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update student count on route
CREATE OR REPLACE FUNCTION update_route_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE education_transport_routes 
    SET current_student_count = current_student_count + 1
    WHERE id = NEW.route_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE education_transport_routes 
    SET current_student_count = current_student_count - 1
    WHERE id = OLD.route_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.route_id IS DISTINCT FROM NEW.route_id THEN
    UPDATE education_transport_routes SET current_student_count = current_student_count - 1 WHERE id = OLD.route_id;
    UPDATE education_transport_routes SET current_student_count = current_student_count + 1 WHERE id = NEW.route_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_route_student_count ON education_transport_students;
CREATE TRIGGER trg_update_route_student_count
  AFTER INSERT OR DELETE OR UPDATE OF route_id ON education_transport_students
  FOR EACH ROW EXECUTE FUNCTION update_route_student_count();

-- Auto-update custody_status on scan
CREATE OR REPLACE FUNCTION update_custody_on_scan()
RETURNS TRIGGER AS $$
DECLARE
  new_custody TEXT;
BEGIN
  CASE NEW.scan_type
    WHEN 'parent_handoff' THEN new_custody := 'with_house_girl';
    WHEN 'house_girl_receive' THEN new_custody := 'with_house_girl';
    WHEN 'house_girl_handoff' THEN new_custody := 'in_psv';
    WHEN 'psv_pickup' THEN new_custody := 'in_psv';
    WHEN 'psv_school_arrival' THEN new_custody := 'at_school';
    WHEN 'teacher_receive' THEN new_custody := 'at_school';
    WHEN 'teacher_attendance' THEN new_custody := 'at_school';
    WHEN 'parent_receive' THEN new_custody := 'home';
    ELSE new_custody := 'home';
  END CASE;

  UPDATE education_transport_students
  SET custody_status = new_custody,
      last_known_lat = NEW.scan_lat,
      last_known_lng = NEW.scan_lng,
      last_known_at = NEW.scanned_at,
      last_scan_id = NEW.id,
      updated_at = now()
  WHERE id = NEW.transport_student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_custody_on_scan ON education_transport_scans;
CREATE TRIGGER trg_update_custody_on_scan
  AFTER INSERT ON education_transport_scans
  FOR EACH ROW EXECUTE FUNCTION update_custody_on_scan();

-- Auto-create anomaly on suspicious scan
CREATE OR REPLACE FUNCTION check_scan_anomaly()
RETURNS TRIGGER AS $$
DECLARE
  prev_scan RECORD;
  route_rec RECORD;
  time_gap INTERVAL;
  geo_distance DECIMAL;
BEGIN
  -- Get route info
  SELECT * INTO route_rec FROM education_transport_routes WHERE id = NEW.route_id;

  -- Check location deviation
  IF NEW.expected_location_lat IS NOT NULL AND NEW.scan_lat IS NOT NULL THEN
    geo_distance := point(NEW.scan_lng, NEW.scan_lat) <-> point(NEW.expected_location_lng, NEW.expected_location_lat);
    -- Rough conversion: 1 degree ~ 111km at equator
    geo_distance := geo_distance * 111000;
    IF geo_distance > 500 THEN -- 500 meters threshold
      NEW.is_anomaly := TRUE;
      NEW.anomaly_reason := 'Scan location deviated ' || ROUND(geo_distance::numeric, 0) || 'm from expected';

      INSERT INTO education_transport_anomalies (
        child_id, transport_student_id, parent_id, route_id,
        anomaly_type, severity, description, related_scan_id,
        detected_lat, detected_lng, status, auto_escalate_at
      ) VALUES (
        NEW.child_id, NEW.transport_student_id, NEW.parent_id, NEW.route_id,
        'wrong_location', 'high',
        'Child scanned at wrong location. Expected near (' || NEW.expected_location_lat || ',' || NEW.expected_location_lng || ') but scanned at (' || NEW.scan_lat || ',' || NEW.scan_lng || ')',
        NEW.id,
        NEW.scan_lat, NEW.scan_lng, 'open', now() + interval '15 minutes'
      );
    END IF;
  END IF;

  -- Check fingerprint mismatch
  IF NEW.fingerprint_verified = FALSE AND NEW.fingerprint_hash IS NOT NULL THEN
    NEW.is_anomaly := TRUE;
    NEW.anomaly_reason := COALESCE(NEW.anomaly_reason || '; ', '') || 'Fingerprint verification failed';

    INSERT INTO education_transport_anomalies (
      child_id, transport_student_id, parent_id, route_id,
      anomaly_type, severity, description, related_scan_id,
      detected_lat, detected_lng, status, auto_escalate_at
    ) VALUES (
      NEW.child_id, NEW.transport_student_id, NEW.parent_id, NEW.route_id,
      'fingerprint_mismatch', 'critical',
      'Fingerprint did not match for ' || NEW.scan_type || ' scan by ' || NEW.scanned_by_role,
      NEW.id,
      NEW.scan_lat, NEW.scan_lng, 'open', now() + interval '5 minutes'
    );
  END IF;

  -- Check time gap from previous scan
  SELECT * INTO prev_scan FROM education_transport_scans
  WHERE transport_student_id = NEW.transport_student_id
  AND scanned_at < NEW.scanned_at
  ORDER BY scanned_at DESC LIMIT 1;

  IF FOUND THEN
    time_gap := NEW.scanned_at - prev_scan.scanned_at;
    IF time_gap > interval '2 hours' AND NEW.scan_type IN ('psv_pickup','teacher_receive') THEN
      NEW.is_anomaly := TRUE;
      NEW.anomaly_reason := COALESCE(NEW.anomaly_reason || '; ', '') || 'Time gap of ' || EXTRACT(HOUR FROM time_gap) || ' hours between scans';

      INSERT INTO education_transport_anomalies (
        child_id, transport_student_id, parent_id, route_id,
        anomaly_type, severity, description, related_scan_id,
        detected_lat, detected_lng, status, auto_escalate_at
      ) VALUES (
        NEW.child_id, NEW.transport_student_id, NEW.parent_id, NEW.route_id,
        'time_gap', 'high',
        'Unusual time gap of ' || EXTRACT(HOUR FROM time_gap) || 'h ' || EXTRACT(MINUTE FROM time_gap) || 'm between custody scans',
        NEW.id,
        NEW.scan_lat, NEW.scan_lng, 'open', now() + interval '10 minutes'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_scan_anomaly ON education_transport_scans;
CREATE TRIGGER trg_check_scan_anomaly
  BEFORE INSERT ON education_transport_scans
  FOR EACH ROW EXECUTE FUNCTION check_scan_anomaly();

-- Auto-create missing-scan anomaly (run via cron/edge function every 15 min)
CREATE OR REPLACE FUNCTION create_missing_scan_anomalies()
RETURNS INTEGER AS $$
DECLARE
  missing_count INTEGER := 0;
  ts RECORD;
  expected_scan TEXT;
  expected_by TIMESTAMPTZ;
BEGIN
  FOR ts IN 
    SELECT * FROM education_transport_students 
    WHERE is_active = TRUE 
    AND custody_status NOT IN ('home','at_school')
  LOOP
    -- Determine what scan is missing based on custody status
    CASE ts.custody_status
      WHEN 'with_house_girl' THEN 
        expected_scan := 'house_girl_handoff';
        expected_by := ts.last_known_at + interval '30 minutes';
      WHEN 'in_psv' THEN 
        expected_scan := 'psv_school_arrival';
        expected_by := ts.last_known_at + interval '2 hours';
      ELSE CONTINUE;
    END CASE;

    IF expected_by < now() THEN
      -- Check if anomaly already exists for this
      IF NOT EXISTS (
        SELECT 1 FROM education_transport_anomalies
        WHERE transport_student_id = ts.id
        AND anomaly_type = 'missing_scan'
        AND status = 'open'
      ) THEN
        INSERT INTO education_transport_anomalies (
          child_id, transport_student_id, parent_id, route_id,
          anomaly_type, severity, description, status, auto_escalate_at
        ) VALUES (
          ts.child_id, ts.id, ts.parent_id, ts.route_id,
          'missing_scan', 'critical',
          'Expected ' || expected_scan || ' scan did not occur. Child custody status: ' || ts.custody_status || '. Last scan at: ' || ts.last_known_at,
          'open', now() + interval '5 minutes'
        );
        missing_count := missing_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN missing_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- NOTIFICATION TRIGGER: Anomaly → Parent + School
-- ============================================================
CREATE OR REPLACE FUNCTION notify_anomaly()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification to parent
  INSERT INTO notifications (user_id, type, title, body, data, priority)
  SELECT 
    NEW.parent_id,
    'transport_anomaly',
    CASE NEW.severity
      WHEN 'critical' THEN '🚨 CRITICAL: Child Safety Alert'
      WHEN 'high' THEN '⚠️ High Priority: Transport Alert'
      ELSE 'Transport Notification'
    END,
    NEW.description,
    jsonb_build_object(
      'anomaly_id', NEW.id,
      'child_id', NEW.child_id,
      'route_id', NEW.route_id,
      'severity', NEW.severity,
      'type', NEW.anomaly_type
    ),
    NEW.severity
  WHERE NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = NEW.parent_id 
    AND data->>'anomaly_id' = NEW.id::text
  );

  NEW.parent_notified := TRUE;
  NEW.parent_notified_at := now();

  -- Send notification to school admin
  INSERT INTO notifications (user_id, type, title, body, data, priority)
  SELECT 
    s.staff_id,
    'transport_anomaly_school',
    'School Transport Alert',
    'Anomaly detected for student. ' || NEW.description,
    jsonb_build_object(
      'anomaly_id', NEW.id,
      'child_id', NEW.child_id,
      'route_id', NEW.route_id
    ),
    NEW.severity
  FROM education_school_staff s
  WHERE s.school_id = (
    SELECT school_id FROM education_transport_routes WHERE id = NEW.route_id
  )
  AND s.role IN ('admin','principal','transport_manager');

  NEW.school_notified := TRUE;
  NEW.school_notified_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_anomaly ON education_transport_anomalies;
CREATE TRIGGER trg_notify_anomaly
  AFTER INSERT ON education_transport_anomalies
  FOR EACH ROW EXECUTE FUNCTION notify_anomaly();

-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE education_transport_routes;
ALTER PUBLICATION supabase_realtime ADD TABLE education_transport_students;
ALTER PUBLICATION supabase_realtime ADD TABLE education_transport_scans;
ALTER PUBLICATION supabase_realtime ADD TABLE education_transport_anomalies;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE education_transport_routes IS 'School transport routes with PSV assignments and geofences';
COMMENT ON TABLE education_transport_students IS 'Child transport assignments with parent payment tracking and live custody status';
COMMENT ON TABLE education_transport_scans IS 'Immutable audit trail of every QR+fingerprint scan in the custody chain';
COMMENT ON TABLE education_transport_anomalies IS 'Auto-detected and manually flagged transport safety anomalies';
