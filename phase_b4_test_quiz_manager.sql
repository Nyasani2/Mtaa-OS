-- ============================================
-- Phase B4: Test & Quiz Manager SQL
-- Tables: education_tests, education_test_questions, education_test_attempts, education_test_answers
-- ============================================

-- education_tests
CREATE TABLE IF NOT EXISTS education_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES education_classes_v2(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES education_subjects(id) ON DELETE SET NULL,
  teacher_id UUID NOT NULL REFERENCES education_teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  test_type TEXT DEFAULT 'quiz' CHECK (test_type IN ('quiz','exam','midterm','final','practice','diagnostic')),
  duration_minutes INTEGER DEFAULT 30,
  max_attempts INTEGER DEFAULT 1,
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  show_results_immediately BOOLEAN DEFAULT true,
  passing_score INTEGER DEFAULT 50,
  total_points INTEGER DEFAULT 100,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','active','closed','archived')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- education_test_questions
CREATE TABLE IF NOT EXISTS education_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES education_tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice','true_false','short_answer','essay','matching','fill_blank','ordering')),
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer JSONB,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  media_url TEXT,
  hint TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- education_test_attempts
CREATE TABLE IF NOT EXISTS education_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES education_tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,
  score INTEGER,
  percentage DECIMAL(5,2),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','graded','abandoned')),
  attempt_number INTEGER DEFAULT 1,
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(test_id, student_id, attempt_number)
);

-- education_test_answers
CREATE TABLE IF NOT EXISTS education_test_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES education_test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES education_test_questions(id) ON DELETE CASCADE,
  answer JSONB,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  feedback TEXT,
  answered_at TIMESTAMPTZ DEFAULT now(),
  time_spent_seconds INTEGER DEFAULT 0,
  UNIQUE(attempt_id, question_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tests_teacher ON education_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tests_class ON education_tests(class_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON education_tests(status);
CREATE INDEX IF NOT EXISTS idx_questions_test ON education_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test ON education_test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON education_test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON education_test_answers(attempt_id);

-- RLS Policies
ALTER TABLE education_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_test_answers ENABLE ROW LEVEL SECURITY;

-- Tests: teachers CRUD own, students read published/active
CREATE POLICY "tests_read" ON education_tests
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR status IN ('published','active','closed')
    OR EXISTS (
      SELECT 1 FROM education_class_enrollments ce
      JOIN education_students s ON s.id = ce.student_id
      WHERE ce.class_id = education_tests.class_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_tests.institution_id AND i.admin_id = auth.uid()
    )
  );

CREATE POLICY "tests_write_teacher" ON education_tests
  FOR ALL USING (teacher_id = auth.uid());

-- Questions: same as tests
CREATE POLICY "questions_read" ON education_test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_tests t
      WHERE t.id = education_test_questions.test_id
      AND (t.teacher_id = auth.uid() OR t.status IN ('published','active','closed'))
    )
  );

CREATE POLICY "questions_write_teacher" ON education_test_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM education_tests t WHERE t.id = education_test_questions.test_id AND t.teacher_id = auth.uid())
  );

-- Attempts: students own, teachers read their tests
CREATE POLICY "attempts_read" ON education_test_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_students s WHERE s.id = education_test_attempts.student_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_tests t WHERE t.id = education_test_attempts.test_id AND t.teacher_id = auth.uid()
    )
  );

CREATE POLICY "attempts_write_student" ON education_test_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_students s WHERE s.id = education_test_attempts.student_id AND s.user_id = auth.uid()
    )
  );

-- Answers: same as attempts
CREATE POLICY "answers_read" ON education_test_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_test_attempts a
      JOIN education_students s ON s.id = a.student_id
      WHERE a.id = education_test_answers.attempt_id AND s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_test_attempts a
      JOIN education_tests t ON t.id = a.test_id
      WHERE a.id = education_test_answers.attempt_id AND t.teacher_id = auth.uid()
    )
  );

CREATE POLICY "answers_write_student" ON education_test_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_test_attempts a
      JOIN education_students s ON s.id = a.student_id
      WHERE a.id = education_test_answers.attempt_id AND s.user_id = auth.uid()
    )
  );

-- Auto-grade function for multiple choice / true-false
CREATE OR REPLACE FUNCTION auto_grade_test_attempt()
RETURNS TRIGGER AS $$
DECLARE
  total_points INTEGER := 0;
  earned_points INTEGER := 0;
  q RECORD;
BEGIN
  IF NEW.status = 'submitted' AND NEW.score IS NULL THEN
    FOR q IN
      SELECT ta.question_id, ta.answer, ta.points_earned, tq.correct_answer, tq.points
      FROM education_test_answers ta
      JOIN education_test_questions tq ON tq.id = ta.question_id
      WHERE ta.attempt_id = NEW.id
    LOOP
      total_points := total_points + q.points;
      -- Simple exact match for MC/TF
      IF q.answer = q.correct_answer THEN
        earned_points := earned_points + q.points;
        UPDATE education_test_answers SET is_correct = true, points_earned = q.points WHERE attempt_id = NEW.id AND question_id = q.question_id;
      ELSE
        UPDATE education_test_answers SET is_correct = false, points_earned = 0 WHERE attempt_id = NEW.id AND question_id = q.question_id;
      END IF;
    END LOOP;

    -- Get test total points
    SELECT COALESCE(total_points, 0) INTO total_points FROM education_tests WHERE id = NEW.test_id;
    IF total_points = 0 THEN total_points := 1; END IF;

    NEW.score := earned_points;
    NEW.percentage := ROUND((earned_points::decimal / total_points) * 100, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_grade_trigger ON education_test_attempts;
CREATE TRIGGER auto_grade_trigger
  BEFORE UPDATE ON education_test_attempts
  FOR EACH ROW WHEN (OLD.status = 'in_progress' AND NEW.status = 'submitted')
  EXECUTE FUNCTION auto_grade_test_attempt();
