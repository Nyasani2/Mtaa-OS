-- ============================================
-- Phase C1: Attendance System SQL
-- Tables: education_attendance_sessions, education_attendance_records, education_attendance_rules
-- ============================================

-- education_attendance_sessions (QR / biometric / hybrid session tracking)
CREATE TABLE IF NOT EXISTS education_attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES education_classes_v2(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES education_teachers(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL DEFAULT 'manual' CHECK (session_type IN ('manual','qr','biometric','hybrid','auto')),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  subject_id UUID REFERENCES education_subjects(id) ON DELETE SET NULL,
  topic TEXT,
  qr_code TEXT,
  qr_expires_at TIMESTAMPTZ,
  biometric_device_id TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  radius_meters INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','closed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- education_attendance_records (individual student attendance per session)
CREATE TABLE IF NOT EXISTS education_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES education_attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused','early_departure','medical')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  check_in_method TEXT CHECK (check_in_method IN ('manual','qr_scan','biometric','auto','parent_call')),
  check_out_method TEXT CHECK (check_out_method IN ('manual','qr_scan','biometric','auto','parent_call')),
  qr_scan_data TEXT,
  biometric_hash TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  device_info TEXT,
  verified_by UUID REFERENCES education_teachers(id) ON DELETE SET NULL,
  verification_notes TEXT,
  parent_notified BOOLEAN DEFAULT false,
  parent_notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- education_attendance_rules (institution-wide attendance policies)
CREATE TABLE IF NOT EXISTS education_attendance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('late_threshold','absence_threshold','early_departure','minimum_attendance','consecutive_absence','qr_validity','biometric_required')),
  value INTEGER NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('minutes','hours','days','percent','sessions')),
  action TEXT NOT NULL CHECK (action IN ('warn','notify_parent','notify_teacher','flag','suspend','auto_excuse')),
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_institution ON education_attendance_sessions(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class ON education_attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON education_attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON education_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON education_attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON education_attendance_records(status);

-- RLS Policies
ALTER TABLE education_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_attendance_rules ENABLE ROW LEVEL SECURITY;

-- Sessions: teachers/admin can CRUD, students can read their class sessions
CREATE POLICY "attendance_sessions_read" ON education_attendance_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_teachers t WHERE t.institution_id = education_attendance_sessions.institution_id AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_students s
      JOIN education_class_enrollments ce ON ce.student_id = s.id
      WHERE ce.class_id = education_attendance_sessions.class_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_attendance_sessions.institution_id AND i.admin_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_guardians g
      JOIN education_students s ON s.guardian_id = g.id
      JOIN education_class_enrollments ce ON ce.student_id = s.id
      WHERE ce.class_id = education_attendance_sessions.class_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "attendance_sessions_write_teacher" ON education_attendance_sessions
  FOR ALL USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_attendance_sessions.institution_id AND i.admin_id = auth.uid()
    )
  );

-- Records: students see own, teachers see class, parents see children
CREATE POLICY "attendance_records_read" ON education_attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_students s WHERE s.id = education_attendance_records.student_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_attendance_sessions ses
      JOIN education_teachers t ON t.id = ses.teacher_id
      WHERE ses.id = education_attendance_records.session_id AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_guardians g
      JOIN education_students s ON s.guardian_id = g.id
      WHERE s.id = education_attendance_records.student_id AND g.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_attendance_sessions ses
      JOIN education_institutions i ON i.id = ses.institution_id
      WHERE ses.id = education_attendance_records.session_id AND i.admin_id = auth.uid()
    )
  );

CREATE POLICY "attendance_records_write_teacher" ON education_attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_attendance_sessions ses
      JOIN education_teachers t ON t.id = ses.teacher_id
      WHERE ses.id = education_attendance_records.session_id AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_attendance_sessions ses
      JOIN education_institutions i ON i.id = ses.institution_id
      WHERE ses.id = education_attendance_records.session_id AND i.admin_id = auth.uid()
    )
  );

-- Rules: institution admin only
CREATE POLICY "attendance_rules_read" ON education_attendance_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_teachers t WHERE t.institution_id = education_attendance_rules.institution_id AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_attendance_rules.institution_id AND i.admin_id = auth.uid()
    )
  );

CREATE POLICY "attendance_rules_write_admin" ON education_attendance_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_attendance_rules.institution_id AND i.admin_id = auth.uid()
    )
  );

-- Auto-mark absent trigger: when session closes, mark unrecorded students as absent
CREATE OR REPLACE FUNCTION auto_mark_absent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    INSERT INTO education_attendance_records (session_id, student_id, status, check_in_method)
    SELECT NEW.id, ce.student_id, 'absent', 'auto'
    FROM education_class_enrollments ce
    WHERE ce.class_id = NEW.class_id
    AND ce.status = 'enrolled'
    AND ce.student_id NOT IN (
      SELECT student_id FROM education_attendance_records WHERE session_id = NEW.id
    )
    ON CONFLICT (session_id, student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_absent_trigger ON education_attendance_sessions;
CREATE TRIGGER auto_absent_trigger
  AFTER UPDATE ON education_attendance_sessions
  FOR EACH ROW WHEN (OLD.status != 'closed' AND NEW.status = 'closed')
  EXECUTE FUNCTION auto_mark_absent();
