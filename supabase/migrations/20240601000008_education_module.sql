
-- ============================================================
-- MTAA AFRIQ — EDUCATION MODULE SCHEMA
-- Kenya Education System: ECD → Primary → JSS → SSS → TVET → University
-- AppStore-installable, NOT OS-embedded
-- ============================================================

-- ============================================================
-- CORE TABLES
-- ============================================================

-- education_institutions: Schools, colleges, universities
CREATE TABLE IF NOT EXISTS public.education_institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  type text NOT NULL CHECK (type = ANY (ARRAY['ecd'::text, 'primary'::text, 'jss'::text, 'sss'::text, 'tvet'::text, 'university'::text, 'international'::text])),
  category text DEFAULT 'public' CHECK (category = ANY (ARRAY['public'::text, 'private'::text, 'mission'::text, 'community'::text])),

  -- Registration
  registration_number text UNIQUE,
  kra_pin text,
  ministry_approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,

  -- Location
  address text,
  city text,
  county text,
  sub_county text,
  ward text,
  country text DEFAULT 'KE',
  latitude numeric,
  longitude numeric,

  -- Contact
  phone text,
  email text,
  website text,

  -- Media
  logo_url text,
  cover_image_url text,
  gallery jsonb DEFAULT '[]'::jsonb,

  -- Head/Admin
  head_teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  head_teacher_name text,
  head_teacher_phone text,

  -- Settings
  levels_offered jsonb DEFAULT '[]'::jsonb, -- ["grade1","grade2",...]
  boarding boolean DEFAULT false,
  day_school boolean DEFAULT true,
  mixed_gender boolean DEFAULT true,
  capacity integer,

  -- Status
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'closed'::text])),
  verification_status text DEFAULT 'unverified' CHECK (verification_status = ANY (ARRAY['unverified'::text, 'pending'::text, 'verified'::text, 'rejected'::text])),

  -- Meta
  settings jsonb DEFAULT '{}'::jsonb,
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- education_teachers: Teacher profiles linked to users
CREATE TABLE IF NOT EXISTS public.education_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id uuid REFERENCES public.education_institutions(id) ON DELETE SET NULL,

  -- Personal
  full_name text NOT NULL,
  phone text,
  email text,
  id_number text UNIQUE, -- Kenyan ID

  -- KYC/Verification
  kyc_status text DEFAULT 'unverified' CHECK (kyc_status = ANY (ARRAY['unverified'::text, 'pending'::text, 'verified'::text, 'rejected'::text])),
  kyc_documents jsonb DEFAULT '[]'::jsonb, -- ["id_front","id_back","certificate"]
  kyc_verified_at timestamptz,
  kyc_verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Professional
  tsc_number text UNIQUE, -- Teachers Service Commission
  license_number text,
  specialization jsonb DEFAULT '[]'::jsonb,
  qualifications jsonb DEFAULT '[]'::jsonb, -- [{degree, institution, year}]
  years_experience integer DEFAULT 0,

  -- Employment
  employment_type text DEFAULT 'full_time' CHECK (employment_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'contract'::text, 'intern'::text])),
  subjects_taught jsonb DEFAULT '[]'::jsonb,
  classes_assigned jsonb DEFAULT '[]'::jsonb,
  is_class_teacher boolean DEFAULT false,
  class_teacher_of uuid REFERENCES public.education_classes(id) ON DELETE SET NULL,

  -- Payroll
  bank_account jsonb DEFAULT '{}'::jsonb,
  salary_grade text,
  allowances jsonb DEFAULT '{}'::jsonb,

  -- Status
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (user_id, institution_id)
);

-- education_students: Student profiles
CREATE TABLE IF NOT EXISTS public.education_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for under-13 managed by parent
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  -- Basic Info
  admission_number text NOT NULL,
  full_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])),

  -- Age verification (for junior feed routing)
  age integer,
  is_minor boolean GENERATED ALWAYS AS (age < 14) STORED,
  parent_guardian_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_guardian_phone text,
  parent_guardian_email text,

  -- Academic
  current_level text NOT NULL, -- "grade1", "form1", etc.
  current_class_id uuid REFERENCES public.education_classes(id) ON DELETE SET NULL,
  stream text,
  previous_school text,

  -- Documents
  documents jsonb DEFAULT '[]'::jsonb, -- birth_cert, transfer_letter, report_cards

  -- Status
  enrollment_status text DEFAULT 'active' CHECK (enrollment_status = ANY (ARRAY['active'::text, 'suspended'::text, 'transferred'::text, 'graduated'::text, 'dropped'::text])),
  enrolled_at timestamptz DEFAULT now(),
  expected_graduation date,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (institution_id, admission_number)
);

-- education_classes: Classrooms/streams
CREATE TABLE IF NOT EXISTS public.education_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,
  name text NOT NULL, -- "Grade 1A", "Form 2B"
  level text NOT NULL, -- "grade1", "form2"
  stream text, -- "A", "B", "Blue"

  class_teacher_id uuid REFERENCES public.education_teachers(id) ON DELETE SET NULL,
  room text,
  capacity integer DEFAULT 40,

  -- Schedule
  timetable jsonb DEFAULT '{}'::jsonb, -- {monday: [{subject, teacher, start, end}]}

  is_active boolean DEFAULT true,
  academic_year text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add FK from students to classes (circular ref fix)
-- Already added above as current_class_id

-- education_subjects: Curriculum subjects
CREATE TABLE IF NOT EXISTS public.education_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES public.education_institutions(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category text CHECK (category = ANY (ARRAY['language'::text, 'science'::text, 'math'::text, 'humanities'::text, 'arts'::text, 'technical'::text, 'pe'::text])),
  level text NOT NULL, -- "primary", "jss", "sss"
  is_compulsory boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- education_lessons: Individual lessons/periods
CREATE TABLE IF NOT EXISTS public.education_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.education_classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.education_subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.education_teachers(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,

  -- Schedule
  scheduled_at timestamptz,
  duration_minutes integer DEFAULT 40,

  -- Content
  content jsonb DEFAULT '{}'::jsonb, -- slides, notes, links
  attachments jsonb DEFAULT '[]'::jsonb,

  -- Online class
  is_online boolean DEFAULT false,
  meeting_link text,
  meeting_platform text, -- "zoom", "google_meet", "jitsi"
  recording_url text,

  -- Status
  status text DEFAULT 'scheduled' CHECK (status = ANY (ARRAY['scheduled'::text, 'live'::text, 'completed'::text, 'cancelled'::text])),
  started_at timestamptz,
  ended_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- education_attendance: Student attendance
CREATE TABLE IF NOT EXISTS public.education_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.education_lessons(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.education_students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.education_classes(id) ON DELETE CASCADE,
  date date NOT NULL,

  status text NOT NULL CHECK (status = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text, 'excused'::text])),
  marked_by uuid REFERENCES public.education_teachers(id) ON DELETE SET NULL,
  notes text,

  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, lesson_id, date)
);

-- education_assignments: Homework, tests, exams
CREATE TABLE IF NOT EXISTS public.education_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.education_classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.education_subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.education_teachers(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type = ANY (ARRAY['homework'::text, 'quiz'::text, 'test'::text, 'exam'::text, 'project'::text])),

  instructions text,
  attachments jsonb DEFAULT '[]'::jsonb,
  max_score numeric DEFAULT 100,

  due_date timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- education_submissions: Student assignment submissions
CREATE TABLE IF NOT EXISTS public.education_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.education_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.education_students(id) ON DELETE CASCADE,

  content text,
  attachments jsonb DEFAULT '[]'::jsonb,

  submitted_at timestamptz DEFAULT now(),
  graded_at timestamptz,
  score numeric,
  feedback text,
  graded_by uuid REFERENCES public.education_teachers(id) ON DELETE SET NULL,

  status text DEFAULT 'submitted' CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'graded'::text, 'late'::text])),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- education_grades: Report card grades
CREATE TABLE IF NOT EXISTS public.education_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.education_students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.education_subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.education_classes(id) ON DELETE CASCADE,

  term text NOT NULL, -- "Term 1 2026"
  exam_type text NOT NULL CHECK (exam_type = ANY (ARRAY['cat'::text, 'mid_term'::text, 'end_term'::text, 'mock'::text, 'kcpe'::text, 'kcse'::text, 'kpsea'::text])),

  score numeric,
  grade text, -- "A", "B+", etc.
  remarks text,

  teacher_id uuid REFERENCES public.education_teachers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- COMMUNICATION & SOCIAL
-- ============================================================

-- education_messages: Teacher-student-parent messaging
CREATE TABLE IF NOT EXISTS public.education_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role = ANY (ARRAY['teacher'::text, 'student'::text, 'parent'::text, 'admin'::text])),

  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.education_classes(id) ON DELETE CASCADE, -- broadcast to class

  subject text,
  body text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,

  is_broadcast boolean DEFAULT false,
  is_announcement boolean DEFAULT false,

  is_read boolean DEFAULT false,
  read_at timestamptz,

  created_at timestamptz DEFAULT now()
);

-- education_feeds: School news, announcements, social posts
CREATE TABLE IF NOT EXISTS public.education_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role = ANY (ARRAY['teacher'::text, 'student'::text, 'admin'::text, 'alumni'::text])),

  title text,
  content text NOT NULL,
  type text DEFAULT 'general' CHECK (type = ANY (ARRAY['general'::text, 'announcement'::text, 'event'::text, 'achievement'::text, 'sports'::text, 'academic'::text])),

  attachments jsonb DEFAULT '[]'::jsonb,

  -- For junior feed (under 14)
  is_junior_safe boolean DEFAULT true,

  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,

  is_pinned boolean DEFAULT false,
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- education_feed_comments: Comments on feed posts
CREATE TABLE IF NOT EXISTS public.education_feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES public.education_feeds(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- education_feed_likes: Likes on posts
CREATE TABLE IF NOT EXISTS public.education_feed_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES public.education_feeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (feed_id, user_id)
);

-- education_events: School events calendar
CREATE TABLE IF NOT EXISTS public.education_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,
  type text CHECK (type = ANY (ARRAY['sports'::text, 'academic'::text, 'cultural'::text, 'religious'::text, 'meeting'::text, 'exam'::text, 'tour'::text])),

  start_at timestamptz NOT NULL,
  end_at timestamptz,
  venue text,

  is_public boolean DEFAULT false,
  target_audience jsonb DEFAULT '[]'::jsonb, -- ["all", "parents", "teachers", "grade7"]

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- ALUMNI & PAYROLL
-- ============================================================

-- education_alumni: Graduated students network
CREATE TABLE IF NOT EXISTS public.education_alumni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  graduation_year integer NOT NULL,
  final_level text NOT NULL,

  current_occupation text,
  current_employer text,
  current_city text,

  is_donor boolean DEFAULT false,
  total_donated numeric DEFAULT 0,

  is_mentor boolean DEFAULT false,
  mentorship_areas jsonb DEFAULT '[]'::jsonb,

  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (user_id, institution_id)
);

-- education_payroll: Teacher salary records
CREATE TABLE IF NOT EXISTS public.education_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.education_teachers(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  month text NOT NULL, -- "2026-05"
  basic_salary numeric NOT NULL DEFAULT 0,
  house_allowance numeric DEFAULT 0,
  transport_allowance numeric DEFAULT 0,
  hardship_allowance numeric DEFAULT 0,
  other_allowances numeric DEFAULT 0,

  gross_pay numeric DEFAULT 0,

  nhif_deduction numeric DEFAULT 0,
  nssf_deduction numeric DEFAULT 0,
  paye_tax numeric DEFAULT 0,
  loan_deduction numeric DEFAULT 0,
  other_deductions numeric DEFAULT 0,

  net_pay numeric DEFAULT 0,

  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'processed'::text, 'paid'::text])),
  paid_at timestamptz,
  paid_via text DEFAULT 'bank_transfer' CHECK (paid_via = ANY (ARRAY['bank_transfer'::text, 'mpesa'::text, 'wallet'::text])),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (teacher_id, month)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_edu_institutions_type ON public.education_institutions(type);
CREATE INDEX IF NOT EXISTS idx_edu_institutions_county ON public.education_institutions(county);
CREATE INDEX IF NOT EXISTS idx_edu_institutions_status ON public.education_institutions(status);
CREATE INDEX IF NOT EXISTS idx_edu_institutions_verified ON public.education_institutions(verification_status);

CREATE INDEX IF NOT EXISTS idx_edu_teachers_user ON public.education_teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_edu_teachers_institution ON public.education_teachers(institution_id);
CREATE INDEX IF NOT EXISTS idx_edu_teachers_kyc ON public.education_teachers(kyc_status);
CREATE INDEX IF NOT EXISTS idx_edu_teachers_active ON public.education_teachers(is_active);

CREATE INDEX IF NOT EXISTS idx_edu_students_user ON public.education_students(user_id);
CREATE INDEX IF NOT EXISTS idx_edu_students_institution ON public.education_students(institution_id);
CREATE INDEX IF NOT EXISTS idx_edu_students_class ON public.education_students(current_class_id);
CREATE INDEX IF NOT EXISTS idx_edu_students_minor ON public.education_students(is_minor);
CREATE INDEX IF NOT EXISTS idx_edu_students_status ON public.education_students(enrollment_status);

CREATE INDEX IF NOT EXISTS idx_edu_classes_institution ON public.education_classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_edu_classes_level ON public.education_classes(level);
CREATE INDEX IF NOT EXISTS idx_edu_classes_teacher ON public.education_classes(class_teacher_id);

CREATE INDEX IF NOT EXISTS idx_edu_lessons_class ON public.education_lessons(class_id);
CREATE INDEX IF NOT EXISTS idx_edu_lessons_teacher ON public.education_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_edu_lessons_status ON public.education_lessons(status);
CREATE INDEX IF NOT EXISTS idx_edu_lessons_scheduled ON public.education_lessons(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_edu_attendance_student ON public.education_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_edu_attendance_date ON public.education_attendance(date);
CREATE INDEX IF NOT EXISTS idx_edu_attendance_lesson ON public.education_attendance(lesson_id);

CREATE INDEX IF NOT EXISTS idx_edu_feeds_institution ON public.education_feeds(institution_id);
CREATE INDEX IF NOT EXISTS idx_edu_feeds_author ON public.education_feeds(author_id);
CREATE INDEX IF NOT EXISTS idx_edu_feeds_type ON public.education_feeds(type);
CREATE INDEX IF NOT EXISTS idx_edu_feeds_junior ON public.education_feeds(is_junior_safe);
CREATE INDEX IF NOT EXISTS idx_edu_feeds_created ON public.education_feeds(created_at);

CREATE INDEX IF NOT EXISTS idx_edu_messages_institution ON public.education_messages(institution_id);
CREATE INDEX IF NOT EXISTS idx_edu_messages_receiver ON public.education_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_edu_messages_class ON public.education_messages(class_id);

CREATE INDEX IF NOT EXISTS idx_edu_payroll_teacher ON public.education_payroll(teacher_id);
CREATE INDEX IF NOT EXISTS idx_edu_payroll_month ON public.education_payroll(month);
CREATE INDEX IF NOT EXISTS idx_edu_payroll_status ON public.education_payroll(status);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.education_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_payroll ENABLE ROW LEVEL SECURITY;

-- Helper: is school admin/head teacher
CREATE OR REPLACE FUNCTION public.is_school_admin(p_institution_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.education_institutions 
    WHERE id = p_institution_id AND (head_teacher_id = p_user_id OR created_at IS NOT NULL)
  ) OR EXISTS (
    SELECT 1 FROM public.education_teachers 
    WHERE institution_id = p_institution_id AND user_id = p_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: is teacher at school
CREATE OR REPLACE FUNCTION public.is_school_teacher(p_institution_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.education_teachers 
    WHERE institution_id = p_institution_id AND user_id = p_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: is student at school
CREATE OR REPLACE FUNCTION public.is_school_student(p_institution_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.education_students 
    WHERE institution_id = p_institution_id AND user_id = p_user_id AND enrollment_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Institutions: viewable by all, manageable by admin
CREATE POLICY "Institutions viewable by all" ON public.education_institutions
  FOR SELECT USING (true);
CREATE POLICY "Institutions manageable by admin" ON public.education_institutions
  FOR ALL USING (head_teacher_id = auth.uid());

-- Teachers: viewable by school members, manageable by self/admin
CREATE POLICY "Teachers viewable by school" ON public.education_teachers
  FOR SELECT USING (user_id = auth.uid() OR is_school_admin(institution_id, auth.uid()));
CREATE POLICY "Teachers manageable by self" ON public.education_teachers
  FOR ALL USING (user_id = auth.uid());

-- Students: viewable by teachers/admin, self/parent
CREATE POLICY "Students viewable by school" ON public.education_students
  FOR SELECT USING (
    user_id = auth.uid() 
    OR parent_guardian_id = auth.uid()
    OR is_school_teacher(institution_id, auth.uid())
    OR is_school_admin(institution_id, auth.uid())
  );
CREATE POLICY "Students manageable by admin" ON public.education_students
  FOR ALL USING (is_school_admin(institution_id, auth.uid()));

-- Classes: viewable by school members
CREATE POLICY "Classes viewable by school" ON public.education_classes
  FOR SELECT USING (is_school_admin(institution_id, auth.uid()) OR is_school_teacher(institution_id, auth.uid()) OR is_school_student(institution_id, auth.uid()));
CREATE POLICY "Classes manageable by admin" ON public.education_classes
  FOR ALL USING (is_school_admin(institution_id, auth.uid()));

-- Lessons: viewable by class members
CREATE POLICY "Lessons viewable by class" ON public.education_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.education_classes c
      WHERE c.id = class_id AND (
        is_school_admin(c.institution_id, auth.uid())
        OR is_school_teacher(c.institution_id, auth.uid())
        OR EXISTS (SELECT 1 FROM public.education_students s WHERE s.current_class_id = c.id AND s.user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Lessons manageable by teacher" ON public.education_lessons
  FOR ALL USING (teacher_id IN (SELECT id FROM public.education_teachers WHERE user_id = auth.uid()));

-- Attendance: viewable by teacher/student/parent
CREATE POLICY "Attendance viewable by related" ON public.education_attendance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.education_students s WHERE s.id = student_id AND (s.user_id = auth.uid() OR s.parent_guardian_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = marked_by AND t.user_id = auth.uid())
  );
CREATE POLICY "Attendance manageable by teacher" ON public.education_attendance
  FOR ALL USING (EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = marked_by AND t.user_id = auth.uid()));

-- Assignments: viewable by class, manageable by teacher
CREATE POLICY "Assignments viewable by class" ON public.education_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.education_classes c
      WHERE c.id = class_id AND (
        is_school_teacher(c.institution_id, auth.uid())
        OR EXISTS (SELECT 1 FROM public.education_students s WHERE s.current_class_id = c.id AND s.user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Assignments manageable by teacher" ON public.education_assignments
  FOR ALL USING (EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

-- Submissions: viewable by student/teacher
CREATE POLICY "Submissions viewable by related" ON public.education_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.education_students s WHERE s.id = student_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_assignments a WHERE a.id = assignment_id AND EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = a.teacher_id AND t.user_id = auth.uid()))
  );
CREATE POLICY "Submissions manageable by student" ON public.education_submissions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.education_students s WHERE s.id = student_id AND s.user_id = auth.uid()));

-- Grades: viewable by student/parent/teacher
CREATE POLICY "Grades viewable by related" ON public.education_grades
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.education_students s WHERE s.id = student_id AND (s.user_id = auth.uid() OR s.parent_guardian_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid())
  );

-- Messages: viewable by sender/receiver/class
CREATE POLICY "Messages viewable by participants" ON public.education_messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_classes c WHERE c.id = class_id AND EXISTS (SELECT 1 FROM public.education_students s WHERE s.current_class_id = c.id AND s.user_id = auth.uid())));
CREATE POLICY "Messages insertable by school" ON public.education_messages
  FOR INSERT WITH CHECK (is_school_teacher(institution_id, auth.uid()) OR is_school_admin(institution_id, auth.uid()) OR is_school_student(institution_id, auth.uid()));

-- Feeds: viewable by all (with junior filter applied in app)
CREATE POLICY "Feeds viewable by all" ON public.education_feeds
  FOR SELECT USING (is_active = true);
CREATE POLICY "Feeds manageable by author" ON public.education_feeds
  FOR ALL USING (author_id = auth.uid());

-- Feed comments/likes: standard
CREATE POLICY "Feed comments viewable" ON public.education_feed_comments
  FOR SELECT USING (is_active = true);
CREATE POLICY "Feed comments manageable" ON public.education_feed_comments
  FOR ALL USING (author_id = auth.uid());

CREATE POLICY "Feed likes viewable" ON public.education_feed_likes
  FOR SELECT USING (true);
CREATE POLICY "Feed likes manageable" ON public.education_feed_likes
  FOR ALL USING (user_id = auth.uid());

-- Events: viewable by all, manageable by admin
CREATE POLICY "Events viewable" ON public.education_events
  FOR SELECT USING (true);
CREATE POLICY "Events manageable by admin" ON public.education_events
  FOR ALL USING (is_school_admin(institution_id, auth.uid()));

-- Alumni: viewable by all alumni of school
CREATE POLICY "Alumni viewable by school" ON public.education_alumni
  FOR SELECT USING (is_active = true);
CREATE POLICY "Alumni manageable by self" ON public.education_alumni
  FOR ALL USING (user_id = auth.uid());

-- Payroll: viewable by teacher/admin
CREATE POLICY "Payroll viewable by teacher" ON public.education_payroll
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()) OR is_school_admin(institution_id, auth.uid()));
CREATE POLICY "Payroll manageable by admin" ON public.education_payroll
  FOR ALL USING (is_school_admin(institution_id, auth.uid()));

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_edu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'education_institutions', 'education_teachers', 'education_students',
    'education_classes', 'education_lessons', 'education_assignments',
    'education_submissions', 'education_grades', 'education_feeds',
    'education_events', 'education_alumni', 'education_payroll'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.update_edu_updated_at()', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- REALTIME
-- ============================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'education_messages', 'education_feeds', 'education_feed_comments',
    'education_lessons', 'education_assignments', 'education_events'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%s', tbl);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- SEED DATA: Kenya Education Levels
-- ============================================================

INSERT INTO public.education_subjects (code, name, category, level, is_compulsory)
VALUES
  ('ENG', 'English', 'language', 'primary', true),
  ('KIS', 'Kiswahili', 'language', 'primary', true),
  ('MAT', 'Mathematics', 'math', 'primary', true),
  ('SCI', 'Science', 'science', 'primary', true),
  ('SST', 'Social Studies', 'humanities', 'primary', true),
  ('CRE', 'Christian Religious Education', 'humanities', 'primary', false),
  ('IRE', 'Islamic Religious Education', 'humanities', 'primary', false),
  ('HRE', 'Hindu Religious Education', 'humanities', 'primary', false),
  ('AGR', 'Agriculture', 'technical', 'jss', false),
  ('BST', 'Business Studies', 'technical', 'jss', false),
  ('COM', 'Computer Studies', 'technical', 'jss', false),
  ('HSC', 'Home Science', 'technical', 'jss', false),
  ('ART', 'Art & Design', 'arts', 'jss', false),
  ('MUS', 'Music', 'arts', 'jss', false),
  ('PE', 'Physical Education', 'pe', 'primary', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
