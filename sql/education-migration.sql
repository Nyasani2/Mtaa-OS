-- ============================================================================
-- MTAA Education Module — Missing Tables Migration
-- ============================================================================

-- 1. EDUCATION CLASSES
CREATE TABLE IF NOT EXISTS education_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID,
    description TEXT,
    max_students INTEGER DEFAULT 50,
    schedule JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_education_classes_teacher ON education_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_education_classes_school ON education_classes(school_id);

ALTER TABLE education_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_classes_select" ON education_classes FOR SELECT USING (true);
CREATE POLICY "education_classes_insert_teacher" ON education_classes FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "education_classes_update_teacher" ON education_classes FOR UPDATE USING (teacher_id = auth.uid());

-- 2. EDUCATION ENROLLMENTS
CREATE TABLE IF NOT EXISTS education_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES education_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_education_enrollments_unique ON education_enrollments(class_id, student_id);
CREATE INDEX IF NOT EXISTS idx_education_enrollments_student ON education_enrollments(student_id);

ALTER TABLE education_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_enrollments_select" ON education_enrollments FOR SELECT USING (true);
CREATE POLICY "education_enrollments_insert" ON education_enrollments FOR INSERT WITH CHECK (true);

-- 3. EDUCATION COURSES
CREATE TABLE IF NOT EXISTS education_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    language TEXT DEFAULT 'English',
    is_paid BOOLEAN DEFAULT false,
    price DECIMAL(10,2) DEFAULT 0,
    duration_hours INTEGER,
    max_students INTEGER DEFAULT 50,
    enrolled_count INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    syllabus TEXT,
    requirements TEXT,
    tags TEXT[] DEFAULT '{}',
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_education_courses_teacher ON education_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_education_courses_subject ON education_courses(subject);
CREATE INDEX IF NOT EXISTS idx_education_courses_grade ON education_courses(grade_level);
CREATE INDEX IF NOT EXISTS idx_education_courses_status ON education_courses(status);

ALTER TABLE education_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_courses_select" ON education_courses FOR SELECT USING (true);
CREATE POLICY "education_courses_insert_teacher" ON education_courses FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "education_courses_update_teacher" ON education_courses FOR UPDATE USING (teacher_id = auth.uid());

-- 4. EDUCATION ASSIGNMENTS
CREATE TABLE IF NOT EXISTS education_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    grade_level TEXT,
    due_date DATE NOT NULL,
    max_score INTEGER DEFAULT 100,
    assignment_type TEXT DEFAULT 'homework' CHECK (assignment_type IN ('homework', 'quiz', 'exam', 'project', 'essay', 'lab_report', 'presentation', 'reading')),
    instructions TEXT,
    attachments TEXT[] DEFAULT '{}',
    allow_late_submission BOOLEAN DEFAULT false,
    late_penalty_percent INTEGER DEFAULT 0,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES education_classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_education_assignments_teacher ON education_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_education_assignments_class ON education_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_education_assignments_due ON education_assignments(due_date);

ALTER TABLE education_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_assignments_select" ON education_assignments FOR SELECT USING (true);
CREATE POLICY "education_assignments_insert_teacher" ON education_assignments FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- 5. EDUCATION SUBMISSIONS
CREATE TABLE IF NOT EXISTS education_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES education_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT,
    attachments TEXT[] DEFAULT '{}',
    score INTEGER,
    feedback TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'late')),
    submitted_at TIMESTAMPTZ DEFAULT now(),
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_education_submissions_unique ON education_submissions(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_education_submissions_student ON education_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_education_submissions_status ON education_submissions(status);

ALTER TABLE education_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_submissions_select" ON education_submissions FOR SELECT USING (true);
CREATE POLICY "education_submissions_insert_student" ON education_submissions FOR INSERT WITH CHECK (student_id = auth.uid());

-- 6. EDUCATION EXAMS
CREATE TABLE IF NOT EXISTS education_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    exam_type TEXT DEFAULT 'mid_term' CHECK (exam_type IN ('mid_term', 'end_term', 'cat', 'quiz', 'final', 'practical', 'oral')),
    class_id UUID REFERENCES education_classes(id) ON DELETE SET NULL,
    duration_minutes INTEGER DEFAULT 60,
    total_marks INTEGER DEFAULT 100,
    exam_date DATE NOT NULL,
    instructions TEXT,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_education_exams_teacher ON education_exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_education_exams_date ON education_exams(exam_date);

ALTER TABLE education_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_exams_select" ON education_exams FOR SELECT USING (true);
CREATE POLICY "education_exams_insert_teacher" ON education_exams FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- 7. EDUCATION GRADES
CREATE TABLE IF NOT EXISTS education_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES education_exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    grade TEXT,
    remarks TEXT,
    marked_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_education_grades_student ON education_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_education_grades_exam ON education_grades(exam_id);

ALTER TABLE education_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_grades_select" ON education_grades FOR SELECT USING (true);
CREATE POLICY "education_grades_insert_teacher" ON education_grades FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- 8. EDUCATION ATTENDANCE
CREATE TABLE IF NOT EXISTS education_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES education_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_education_attendance_student ON education_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_education_attendance_date ON education_attendance(date);

ALTER TABLE education_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_attendance_select" ON education_attendance FOR SELECT USING (true);
CREATE POLICY "education_attendance_insert_teacher" ON education_attendance FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- 9. EDUCATION TIMETABLE
CREATE TABLE IF NOT EXISTS education_timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES education_classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject TEXT NOT NULL,
    room TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_education_timetable_class ON education_timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_education_timetable_day ON education_timetable(day);

ALTER TABLE education_timetable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_timetable_select" ON education_timetable FOR SELECT USING (true);

-- 10. EDUCATION ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS education_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'parents', 'teachers', 'staff')),
    school_id UUID,
    posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_education_announcements_target ON education_announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_education_announcements_status ON education_announcements(status);

ALTER TABLE education_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_announcements_select" ON education_announcements FOR SELECT USING (true);
CREATE POLICY "education_announcements_insert" ON education_announcements FOR INSERT WITH CHECK (posted_by = auth.uid());

-- 11. EDUCATION RESOURCES / LIBRARY
CREATE TABLE IF NOT EXISTS education_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'video', 'audio', 'image', 'document', 'worksheet', 'exam', 'notes')),
    subject TEXT,
    grade_level TEXT,
    file_url TEXT,
    download_count INTEGER DEFAULT 0,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_education_resources_type ON education_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_education_resources_subject ON education_resources(subject);

ALTER TABLE education_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_resources_select" ON education_resources FOR SELECT USING (status = 'approved');
CREATE POLICY "education_resources_insert" ON education_resources FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- 12. EDUCATION FEE STATEMENTS
CREATE TABLE IF NOT EXISTS education_fee_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID,
    fee_type TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
    due_date DATE NOT NULL,
    term TEXT NOT NULL,
    year INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_education_fees_student ON education_fee_statements(student_id);
CREATE INDEX IF NOT EXISTS idx_education_fees_status ON education_fee_statements(status);

ALTER TABLE education_fee_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_fees_select_own" ON education_fee_statements FOR SELECT USING (student_id = auth.uid());

-- 13. EDUCATION STUDENT PARENTS (linking)
CREATE TABLE IF NOT EXISTS education_student_parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent' CHECK (relationship IN ('parent', 'guardian', 'sponsor')),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_education_student_parents_parent ON education_student_parents(parent_id);

ALTER TABLE education_student_parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_student_parents_select" ON education_student_parents FOR SELECT USING (parent_id = auth.uid() OR student_id = auth.uid());

-- 14. EDUCATION TEACHERS
CREATE TABLE IF NOT EXISTS education_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_number TEXT UNIQUE,
    qualification TEXT,
    specialization TEXT,
    years_experience INTEGER DEFAULT 0,
    license_number TEXT,
    is_verified BOOLEAN DEFAULT false,
    school_id UUID,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_education_teachers_user ON education_teachers(user_id);

ALTER TABLE education_teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_teachers_select" ON education_teachers FOR SELECT USING (true);

-- 15. EDUCATION STUDENTS
CREATE TABLE IF NOT EXISTS education_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admission_number TEXT UNIQUE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    current_grade TEXT,
    school_id UUID,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'transferred', 'suspended', 'dropped')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_education_students_user ON education_students(user_id);

ALTER TABLE education_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_students_select" ON education_students FOR SELECT USING (true);

-- 16. Function to pay school fees via wallet
CREATE OR REPLACE FUNCTION pay_school_fee(
    p_statement_id UUID,
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_balance DECIMAL;
    v_statement RECORD;
BEGIN
    -- Get wallet balance
    SELECT balance INTO v_wallet_balance
    FROM wallets WHERE user_id = p_user_id;

    IF v_wallet_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    -- Get fee statement
    SELECT * INTO v_statement
    FROM education_fee_statements WHERE id = p_statement_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fee statement not found';
    END IF;

    -- Deduct from wallet
    UPDATE wallets
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Update fee statement
    UPDATE education_fee_statements
    SET amount_paid = amount_paid + p_amount,
        status = CASE
            WHEN amount_paid + p_amount >= amount THEN 'paid'
            WHEN amount_paid + p_amount > 0 THEN 'partial'
            ELSE status
        END,
        updated_at = now()
    WHERE id = p_statement_id;

    -- Record transaction
    INSERT INTO wallet_transactions (
        user_id, type, amount, currency, status,
        description, metadata
    ) VALUES (
        p_user_id, 'debit', p_amount, 'KES', 'completed',
        'School fee payment: ' || v_statement.fee_type,
        jsonb_build_object('fee_statement_id', p_statement_id)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Function to auto-calculate grade letter
CREATE OR REPLACE FUNCTION calculate_grade_letter(p_score INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF p_score >= 80 THEN RETURN 'A';
    ELSIF p_score >= 75 THEN RETURN 'A-';
    ELSIF p_score >= 70 THEN RETURN 'B+';
    ELSIF p_score >= 65 THEN RETURN 'B';
    ELSIF p_score >= 60 THEN RETURN 'B-';
    ELSIF p_score >= 55 THEN RETURN 'C+';
    ELSIF p_score >= 50 THEN RETURN 'C';
    ELSIF p_score >= 45 THEN RETURN 'C-';
    ELSIF p_score >= 40 THEN RETURN 'D+';
    ELSIF p_score >= 35 THEN RETURN 'D';
    ELSIF p_score >= 30 THEN RETURN 'D-';
    ELSE RETURN 'E';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 18. Trigger to auto-set grade letter
CREATE OR REPLACE FUNCTION auto_set_grade_letter()
RETURNS TRIGGER AS $$
BEGIN
    NEW.grade = calculate_grade_letter(NEW.score);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_grade_letter ON education_grades;
CREATE TRIGGER trg_auto_grade_letter
    BEFORE INSERT OR UPDATE ON education_grades
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_grade_letter();
