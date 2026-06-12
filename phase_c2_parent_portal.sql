-- ============================================
-- Phase C2: Parent Portal SQL
-- Tables: education_parent_connections, education_parent_notifications, education_parent_feedback
-- ============================================

-- education_parent_connections (links guardians to students with relationship type)
CREATE TABLE IF NOT EXISTS education_parent_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES education_guardians(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'parent' CHECK (relationship_type IN ('parent','guardian','step_parent','grandparent','sibling','other')),
  is_primary_contact BOOLEAN DEFAULT false,
  can_pickup BOOLEAN DEFAULT true,
  can_view_grades BOOLEAN DEFAULT true,
  can_view_attendance BOOLEAN DEFAULT true,
  can_view_health BOOLEAN DEFAULT false,
  can_make_payments BOOLEAN DEFAULT true,
  can_message_teacher BOOLEAN DEFAULT true,
  emergency_contact BOOLEAN DEFAULT false,
  emergency_priority INTEGER DEFAULT 1,
  verified_at TIMESTAMPTZ,
  verification_method TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guardian_id, student_id)
);

-- education_parent_notifications (targeted parent communications)
CREATE TABLE IF NOT EXISTS education_parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES education_guardians(id) ON DELETE CASCADE,
  student_id UUID REFERENCES education_students(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('attendance_alert','grade_posted','assignment_due','behavior_incident','fee_reminder','event_notice','emergency','general','transport_delay','safety_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  sent_via TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- education_parent_feedback (parent-teacher communication)
CREATE TABLE IF NOT EXISTS education_parent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES education_guardians(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES education_teachers(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('academic','behavior','attendance','health','transport','fee','general','complaint','compliment')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed','escalated')),
  response TEXT,
  responded_by UUID REFERENCES education_teachers(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parent_connections_guardian ON education_parent_connections(guardian_id);
CREATE INDEX IF NOT EXISTS idx_parent_connections_student ON education_parent_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_guardian ON education_parent_notifications(guardian_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_read ON education_parent_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_type ON education_parent_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_parent_feedback_guardian ON education_parent_feedback(guardian_id);
CREATE INDEX IF NOT EXISTS idx_parent_feedback_status ON education_parent_feedback(status);
CREATE INDEX IF NOT EXISTS idx_parent_feedback_student ON education_parent_feedback(student_id);

-- RLS Policies
ALTER TABLE education_parent_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_parent_feedback ENABLE ROW LEVEL SECURITY;

-- Connections: guardians see own, teachers see students they teach
CREATE POLICY "parent_connections_read" ON education_parent_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_guardians g WHERE g.id = education_parent_connections.guardian_id AND g.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_teachers t
      JOIN education_class_enrollments ce ON ce.student_id = education_parent_connections.student_id
      JOIN education_classes_v2 c ON c.id = ce.class_id
      WHERE t.id = c.teacher_id AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_parent_connections.guardian_id AND i.admin_id = auth.uid()
    )
  );

CREATE POLICY "parent_connections_write_guardian" ON education_parent_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_guardians g WHERE g.id = education_parent_connections.guardian_id AND g.user_id = auth.uid()
    )
  );

-- Notifications: guardians read own, admin can create
CREATE POLICY "parent_notifications_read" ON education_parent_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_guardians g WHERE g.id = education_parent_notifications.guardian_id AND g.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_parent_notifications.institution_id AND i.admin_id = auth.uid()
    )
  );

CREATE POLICY "parent_notifications_write_admin" ON education_parent_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_parent_notifications.institution_id AND i.admin_id = auth.uid()
    )
  );

-- Feedback: guardians CRUD own, teachers respond
CREATE POLICY "parent_feedback_read" ON education_parent_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_guardians g WHERE g.id = education_parent_feedback.guardian_id AND g.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_teachers t WHERE t.id = education_parent_feedback.teacher_id AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_parent_feedback.institution_id AND i.admin_id = auth.uid()
    )
  );

CREATE POLICY "parent_feedback_write_guardian" ON education_parent_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_guardians g WHERE g.id = education_parent_feedback.guardian_id AND g.user_id = auth.uid()
    )
  );

-- Mark notification read function
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE education_parent_notifications
  SET is_read = true, read_at = now()
  WHERE id = notification_id
  AND EXISTS (
    SELECT 1 FROM education_guardians g
    WHERE g.id = education_parent_notifications.guardian_id AND g.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
