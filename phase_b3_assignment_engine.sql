-- ============================================
-- Phase B3: Assignment Engine SQL
-- Tables: education_assignments, education_assignment_submissions, education_grades
-- ============================================

-- education_assignments
CREATE TABLE IF NOT EXISTS education_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES education_classes_v2(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES education_subjects(id) ON DELETE SET NULL,
  teacher_id UUID NOT NULL REFERENCES education_teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  assignment_type TEXT DEFAULT 'homework' CHECK (assignment_type IN ('homework','quiz','project','essay','lab_report','presentation','reading','extra_credit')),
  max_score INTEGER DEFAULT 100,
  passing_score INTEGER DEFAULT 50,
  due_date TIMESTAMPTZ,
  allow_late_submission BOOLEAN DEFAULT false,
  late_penalty_percent INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  rubric JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','closed','archived')),
  publish_at TIMESTAMPTZ,
  auto_grade BOOLEAN DEFAULT false,
  answer_key JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- education_assignment_submissions
CREATE TABLE IF NOT EXISTS education_assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES education_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  submission_text TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  is_late BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft','submitted','graded','returned','late')),
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES education_teachers(id),
  score INTEGER,
  feedback TEXT,
  rubric_scores JSONB DEFAULT '{}'::jsonb,
  plagiarism_score INTEGER,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id, attempt_number)
);

-- education_grades (master gradebook)
CREATE TABLE IF NOT EXISTS education_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES education_classes_v2(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES education_subjects(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES education_assignments(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES education_teachers(id) ON DELETE SET NULL,
  grade_type TEXT NOT NULL CHECK (grade_type IN ('assignment','exam','quiz','project','participation','attendance','final')),
  score INTEGER NOT NULL,
  max_score INTEGER DEFAULT 100,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN max_score > 0 THEN ROUND((score::decimal / max_score) * 100, 2) ELSE 0 END
  ) STORED,
  letter_grade TEXT GENERATED ALWAYS AS (
    CASE
      WHEN max_score > 0 AND (score::decimal / max_score) * 100 >= 90 THEN 'A'
      WHEN max_score > 0 AND (score::decimal / max_score) * 100 >= 80 THEN 'B'
      WHEN max_score > 0 AND (score::decimal / max_score) * 100 >= 70 THEN 'C'
      WHEN max_score > 0 AND (score::decimal / max_score) * 100 >= 60 THEN 'D'
      ELSE 'F'
    END
  ) STORED,
  feedback TEXT,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  is_finalized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON education_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON education_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON education_assignments(status);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON education_assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON education_assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON education_assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_grades_student ON education_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class ON education_grades(class_id);

-- RLS Policies
ALTER TABLE education_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_grades ENABLE ROW LEVEL SECURITY;

-- Assignments: teachers can CRUD their own, students can read published
CREATE POLICY "assignments_read" ON education_assignments
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR status = 'published'
    OR EXISTS (
      SELECT 1 FROM education_class_enrollments ce
      JOIN education_students s ON s.id = ce.student_id
      WHERE ce.class_id = education_assignments.class_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_assignments.institution_id AND i.admin_id = auth.uid()
    )
  );

CREATE POLICY "assignments_write_teacher" ON education_assignments
  FOR ALL USING (teacher_id = auth.uid());

-- Submissions: students can CRUD their own, teachers can read/grade their class
CREATE POLICY "submissions_read" ON education_assignment_submissions
  FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM education_assignments a
      JOIN education_teachers t ON t.id = a.teacher_id
      WHERE a.id = education_assignment_submissions.assignment_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "submissions_write_student" ON education_assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_students s WHERE s.id = education_assignment_submissions.student_id AND s.user_id = auth.uid()
    )
  );

-- Grades: students read their own, teachers read their class
CREATE POLICY "grades_read" ON education_grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_students s WHERE s.id = education_grades.student_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_teachers t WHERE t.id = education_grades.teacher_id AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_guardians g
      JOIN education_students s ON s.guardian_id = g.id
      WHERE s.id = education_grades.student_id AND g.user_id = auth.uid()
    )
  );

-- Late submission trigger
CREATE OR REPLACE FUNCTION check_late_submission()
RETURNS TRIGGER AS $$
DECLARE
  due TIMESTAMPTZ;
BEGIN
  SELECT due_date INTO due FROM education_assignments WHERE id = NEW.assignment_id;
  IF due IS NOT NULL AND NEW.submitted_at > due THEN
    NEW.is_late := true;
    NEW.status := 'late';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS late_submission_trigger ON education_assignment_submissions;
CREATE TRIGGER late_submission_trigger
  BEFORE INSERT OR UPDATE ON education_assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION check_late_submission();

-- Grade sync trigger: when submission is graded, upsert into grades
CREATE OR REPLACE FUNCTION sync_grade_from_submission()
RETURNS TRIGGER AS $$
DECLARE
  assignment_rec RECORD;
  class_id_val UUID;
  subject_id_val UUID;
BEGIN
  IF NEW.status = 'graded' AND NEW.score IS NOT NULL THEN
    SELECT a.class_id, a.subject_id, a.teacher_id, a.max_score, a.title, a.term, a.academic_year
    INTO assignment_rec
    FROM education_assignments a WHERE a.id = NEW.assignment_id;

    INSERT INTO education_grades (student_id, class_id, subject_id, assignment_id, teacher_id, grade_type, score, max_score, feedback, term, academic_year)
    VALUES (NEW.student_id, assignment_rec.class_id, assignment_rec.subject_id, NEW.assignment_id, assignment_rec.teacher_id, 'assignment', NEW.score, assignment_rec.max_score, NEW.feedback, assignment_rec.term, assignment_rec.academic_year)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS grade_sync_trigger ON education_assignment_submissions;
CREATE TRIGGER grade_sync_trigger
  AFTER UPDATE ON education_assignment_submissions
  FOR EACH ROW WHEN (OLD.status != 'graded' AND NEW.status = 'graded')
  EXECUTE FUNCTION sync_grade_from_submission();
