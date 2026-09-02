
-- MTAA Education Module — Full Schema
-- Created: 2026-06-27
-- Supports: School Admin, Teacher, Student, Parent, Principal, Driver, Ministry Official

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Schools / Institutions
CREATE TABLE IF NOT EXISTS education_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('primary', 'secondary', 'university', 'college', 'vocational', 'kindergarten')),
  registration_number TEXT UNIQUE,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Kenya',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  principal_id UUID REFERENCES profiles(user_id),
  established_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- School Admins (Principals, Headmasters, Deputies)
CREATE TABLE IF NOT EXISTS education_school_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('principal', 'deputy_principal', 'headmaster', 'bursar', 'secretary')),
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, institution_id)
);

-- Teachers
CREATE TABLE IF NOT EXISTS education_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  employee_number TEXT,
  subjects TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  specialization TEXT,
  years_experience INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'suspended', 'retired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, institution_id)
);

-- Classes / Grades
CREATE TABLE IF NOT EXISTS education_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  stream TEXT DEFAULT 'A',
  class_teacher_id UUID REFERENCES education_teachers(id),
  capacity INTEGER DEFAULT 40,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('term_1', 'term_2', 'term_3')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Students
CREATE TABLE IF NOT EXISTS education_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES education_classes(id),
  admission_number TEXT NOT NULL,
  roll_number TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_group TEXT,
  medical_alerts TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  transport_route_id UUID,
  pickup_point TEXT,
  dropoff_point TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'transferred', 'graduated', 'expelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(admission_number, institution_id)
);

-- Parent-Student Connections
CREATE TABLE IF NOT EXISTS education_parent_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('mother', 'father', 'guardian', 'grandparent', 'sibling', 'other')),
  is_primary_contact BOOLEAN DEFAULT false,
  can_pickup BOOLEAN DEFAULT true,
  can_receive_reports BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- Subjects
CREATE TABLE IF NOT EXISTS education_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  category TEXT CHECK (category IN ('core', 'elective', 'extracurricular')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Class-Subject Assignments (which teacher teaches which subject in which class)
CREATE TABLE IF NOT EXISTS education_class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES education_classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES education_subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES education_teachers(id) ON DELETE CASCADE,
  schedule JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

-- ============================================================
-- ACADEMIC TABLES
-- ============================================================

-- Assignments / Homework
CREATE TABLE IF NOT EXISTS education_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_subject_id UUID NOT NULL REFERENCES education_class_subjects(id),
  teacher_id UUID NOT NULL REFERENCES education_teachers(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'homework' CHECK (type IN ('homework', 'classwork', 'project', 'quiz', 'test', 'exam')),
  max_score INTEGER DEFAULT 100,
  due_date TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'graded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student Submissions
CREATE TABLE IF NOT EXISTS education_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES education_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  score INTEGER,
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'late', 'graded', 'returned')),
  graded_by UUID REFERENCES education_teachers(id),
  graded_at TIMESTAMPTZ
);

-- Grades / Report Cards
CREATE TABLE IF NOT EXISTS education_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  class_subject_id UUID NOT NULL REFERENCES education_class_subjects(id),
  assignment_id UUID REFERENCES education_assignments(id),
  score INTEGER NOT NULL,
  max_score INTEGER DEFAULT 100,
  grade_letter TEXT,
  remarks TEXT,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  recorded_by UUID REFERENCES education_teachers(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance
CREATE TABLE IF NOT EXISTS education_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES education_students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES education_classes(id),
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'sick')),
  marked_by UUID REFERENCES education_teachers(id),
  marked_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(student_id, date, class_id)
);

-- Timetable / Schedule
CREATE TABLE IF NOT EXISTS education_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES education_classes(id) ON DELETE CASCADE,
  class_subject_id UUID NOT NULL REFERENCES education_class_subjects(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- COMMUNICATION TABLES
-- ============================================================

-- Announcements
CREATE TABLE IF NOT EXISTS education_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES profiles(user_id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages between teachers and parents
CREATE TABLE IF NOT EXISTS education_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(user_id),
  receiver_id UUID NOT NULL REFERENCES profiles(user_id),
  student_id UUID REFERENCES education_students(id),
  subject TEXT,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FINANCE TABLES
-- ============================================================

-- Fee Structure
CREATE TABLE IF NOT EXISTS education_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT DEFAULT 'term' CHECK (frequency IN ('once', 'term', 'year', 'monthly')),
  applicable_grades TEXT[] DEFAULT '{}',
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fee Payments (linked to Wallet OS)
CREATE TABLE IF NOT EXISTS education_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID NOT NULL REFERENCES education_fees(id),
  student_id UUID NOT NULL REFERENCES education_students(id),
  payer_id UUID NOT NULL REFERENCES profiles(user_id),
  amount DECIMAL(10,2) NOT NULL,
  wallet_transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LIBRARY TABLES
-- ============================================================

-- Library Resources
CREATE TABLE IF NOT EXISTS education_library_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  category TEXT,
  type TEXT DEFAULT 'book' CHECK (type IN ('book', 'ebook', 'video', 'audio', 'document')),
  url TEXT,
  cover_url TEXT,
  description TEXT,
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Borrow Records
CREATE TABLE IF NOT EXISTS education_library_borrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES education_library_resources(id),
  student_id UUID REFERENCES education_students(id),
  teacher_id UUID REFERENCES education_teachers(id),
  borrowed_at TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  status TEXT DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue', 'lost'))
);

-- ============================================================
-- EVENTS & CALENDAR
-- ============================================================

CREATE TABLE IF NOT EXISTS education_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'general' CHECK (event_type IN ('general', 'exam', 'sports', 'meeting', 'holiday', 'trip')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  target_audience TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE education_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_school_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_parent_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_library_borrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_events ENABLE ROW LEVEL SECURITY;

-- Institutions: anyone can view active schools
CREATE POLICY "institutions_select_all" ON education_institutions FOR SELECT USING (status = 'active');
CREATE POLICY "institutions_insert_admin" ON education_institutions FOR INSERT WITH CHECK (true);
CREATE POLICY "institutions_update_admin" ON education_institutions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM education_school_admins WHERE user_id = auth.uid() AND institution_id = education_institutions.id)
);

-- School Admins: principals can manage their school
CREATE POLICY "school_admins_select" ON education_school_admins FOR SELECT USING (true);
CREATE POLICY "school_admins_insert" ON education_school_admins FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM education_school_admins WHERE user_id = auth.uid() AND institution_id = education_school_admins.institution_id AND role = 'principal')
);

-- Teachers: can view their school's data
CREATE POLICY "teachers_select" ON education_teachers FOR SELECT USING (true);
CREATE POLICY "teachers_insert" ON education_teachers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM education_school_admins WHERE user_id = auth.uid() AND institution_id = education_teachers.institution_id)
);

-- Students: view own record, parents view their children
CREATE POLICY "students_select" ON education_students FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM education_parent_connections WHERE parent_id = auth.uid() AND student_id = education_students.id)
);

-- Parents: view own connections
CREATE POLICY "parent_connections_select" ON education_parent_connections FOR SELECT USING (
  parent_id = auth.uid() OR
  EXISTS (SELECT 1 FROM education_students WHERE id = education_parent_connections.student_id AND user_id = auth.uid())
);

-- Classes: view if student or teacher in class
CREATE POLICY "classes_select" ON education_classes FOR SELECT USING (true);

-- Assignments: view if in class
CREATE POLICY "assignments_select" ON education_assignments FOR SELECT USING (true);
CREATE POLICY "assignments_insert" ON education_assignments FOR INSERT WITH CHECK (
  teacher_id IN (SELECT id FROM education_teachers WHERE user_id = auth.uid())
);

-- Submissions: student submits, teacher grades
CREATE POLICY "submissions_select" ON education_submissions FOR SELECT USING (
  student_id IN (SELECT id FROM education_students WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM education_assignments WHERE id = education_submissions.assignment_id AND teacher_id IN (SELECT id FROM education_teachers WHERE user_id = auth.uid()))
);

-- Grades: view own or parent's children
CREATE POLICY "grades_select" ON education_grades FOR SELECT USING (
  student_id IN (SELECT id FROM education_students WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM education_parent_connections WHERE parent_id = auth.uid() AND student_id = education_grades.student_id)
);

-- Attendance: view own or parent's children
CREATE POLICY "attendance_select" ON education_attendance FOR SELECT USING (
  student_id IN (SELECT id FROM education_students WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM education_parent_connections WHERE parent_id = auth.uid() AND student_id = education_attendance.student_id)
);
CREATE POLICY "attendance_insert" ON education_attendance FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM education_teachers WHERE user_id = auth.uid() AND id = education_attendance.marked_by)
);

-- Timetable: view if in class
CREATE POLICY "timetable_select" ON education_timetable FOR SELECT USING (true);

-- Messages: sender or receiver
CREATE POLICY "messages_select" ON education_messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "messages_insert" ON education_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Fees: view if admin or parent of student
CREATE POLICY "fees_select" ON education_fees FOR SELECT USING (true);
CREATE POLICY "fee_payments_select" ON education_fee_payments FOR SELECT USING (
  payer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM education_school_admins WHERE user_id = auth.uid() AND institution_id = education_fee_payments.fee_id)
);

-- Library: view all, borrow if student/teacher
CREATE POLICY "library_select" ON education_library_resources FOR SELECT USING (true);
CREATE POLICY "library_borrows_select" ON education_library_borrows FOR SELECT USING (
  student_id IN (SELECT id FROM education_students WHERE user_id = auth.uid()) OR
  teacher_id IN (SELECT id FROM education_teachers WHERE user_id = auth.uid())
);

-- Events: view all
CREATE POLICY "events_select" ON education_events FOR SELECT USING (true);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_students_institution ON education_students(institution_id);
CREATE INDEX idx_students_class ON education_students(class_id);
CREATE INDEX idx_students_user ON education_students(user_id);
CREATE INDEX idx_teachers_institution ON education_teachers(institution_id);
CREATE INDEX idx_classes_institution ON education_classes(institution_id);
CREATE INDEX idx_attendance_student_date ON education_attendance(student_id, date);
CREATE INDEX idx_grades_student ON education_grades(student_id);
CREATE INDEX idx_assignments_teacher ON education_assignments(teacher_id);
CREATE INDEX idx_submissions_assignment ON education_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON education_submissions(student_id);
CREATE INDEX idx_parent_connections_parent ON education_parent_connections(parent_id);
CREATE INDEX idx_parent_connections_student ON education_parent_connections(student_id);
CREATE INDEX idx_fee_payments_student ON education_fee_payments(student_id);
CREATE INDEX idx_messages_sender ON education_messages(sender_id);
CREATE INDEX idx_messages_receiver ON education_messages(receiver_id);
