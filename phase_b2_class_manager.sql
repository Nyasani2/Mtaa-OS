-- ============================================
-- Phase B2: Class Manager SQL
-- Tables: education_classes_v2, education_class_enrollments, education_class_schedules
-- ============================================

-- education_classes_v2 (enhanced from existing education_classes)
CREATE TABLE IF NOT EXISTS education_classes_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 16),
  stream TEXT,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL DEFAULT 'Term 1',
  capacity INTEGER DEFAULT 40,
  current_enrollment INTEGER DEFAULT 0,
  teacher_id UUID REFERENCES education_teachers(id),
  assistant_teacher_id UUID REFERENCES education_teachers(id),
  room TEXT,
  building TEXT,
  schedule JSONB DEFAULT '[]'::jsonb, -- [{day, start_time, end_time, subject_id}]
  status TEXT DEFAULT 'active' CHECK (status IN ('active','archived','suspended')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- education_class_enrollments
CREATE TABLE IF NOT EXISTS education_class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES education_classes_v2(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled','transferred','withdrawn','graduated','suspended')),
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  previous_class_id UUID REFERENCES education_classes_v2(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, student_id, academic_year, term)
);

-- education_class_schedules
CREATE TABLE IF NOT EXISTS education_class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES education_classes_v2(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES education_subjects(id),
  teacher_id UUID REFERENCES education_teachers(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  lesson_type TEXT DEFAULT 'regular' CHECK (lesson_type IN ('regular','lab','sports','exam','revision','extra')),
  recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE education_classes_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_class_schedules ENABLE ROW LEVEL SECURITY;

-- Classes: institution members can read
CREATE POLICY "class_read_institution" ON education_classes_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_institutions i
      JOIN education_teachers t ON t.institution_id = i.id
      WHERE i.id = education_classes_v2.institution_id AND t.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM education_students s
      JOIN education_class_enrollments ce ON ce.student_id = s.id
      WHERE ce.class_id = education_classes_v2.id AND s.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM education_guardians g
      JOIN education_students s ON s.guardian_id = g.id
      JOIN education_class_enrollments ce ON ce.student_id = s.id
      WHERE ce.class_id = education_classes_v2.id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "class_write_admin" ON education_classes_v2
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_institutions i
      WHERE i.id = education_classes_v2.institution_id AND i.admin_id = auth.uid()
    )
  );

-- Enrollments
CREATE POLICY "enrollment_read" ON education_class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_students s WHERE s.id = education_class_enrollments.student_id AND s.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM education_guardians g
      JOIN education_students s ON s.guardian_id = g.id
      WHERE s.id = education_class_enrollments.student_id AND g.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM education_classes_v2 c
      JOIN education_teachers t ON t.id = c.teacher_id
      WHERE c.id = education_class_enrollments.class_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "enrollment_write_admin" ON education_class_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_classes_v2 c
      JOIN education_institutions i ON i.id = c.institution_id
      WHERE c.id = education_class_enrollments.class_id AND i.admin_id = auth.uid()
    )
  );

-- Schedules
CREATE POLICY "schedule_read" ON education_class_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_classes_v2 c
      WHERE c.id = education_class_schedules.class_id
      AND (
        EXISTS (SELECT 1 FROM education_teachers t WHERE t.institution_id = c.institution_id AND t.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM education_students s JOIN education_class_enrollments ce ON ce.student_id = s.id WHERE ce.class_id = c.id AND s.user_id = auth.uid())
      )
    )
  );

-- Update trigger
CREATE OR REPLACE FUNCTION update_class_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'enrolled' THEN
    UPDATE education_classes_v2 SET current_enrollment = current_enrollment + 1 WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'enrolled' AND NEW.status != 'enrolled' THEN
    UPDATE education_classes_v2 SET current_enrollment = current_enrollment - 1 WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'enrolled' AND NEW.status = 'enrolled' THEN
    UPDATE education_classes_v2 SET current_enrollment = current_enrollment + 1 WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'enrolled' THEN
    UPDATE education_classes_v2 SET current_enrollment = current_enrollment - 1 WHERE id = OLD.class_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS class_enrollment_trigger ON education_class_enrollments;
CREATE TRIGGER class_enrollment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON education_class_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_class_enrollment_count();
