-- MTAA OS V10 — Missing Tables Schema
-- Run this in Supabase SQL Editor
-- Date: 2026-07-02

-- ============================================================
-- WALLET MODULE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT wallet_accounts_user_id_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'payment', 'refund')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_escrow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.wallet_transactions(id),
  amount numeric NOT NULL,
  released boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- EDUCATION MODULE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.education_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  level text,
  subject text,
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.education_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.education_courses(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  progress_percent integer DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT education_enrollments_unique UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.education_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.education_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  max_score integer NOT NULL DEFAULT 100,
  exam_date timestamptz,
  duration_minutes integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.education_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.education_exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score numeric NOT NULL CHECK (score >= 0),
  remarks text,
  graded_at timestamptz DEFAULT now(),
  CONSTRAINT education_grades_unique UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.education_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.education_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('pdf', 'video', 'link', 'document', 'image')),
  url text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.education_timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.education_courses(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- MARKETPLACE MODULE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  category text,
  condition text DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved', 'withdrawn')),
  images jsonb DEFAULT '[]',
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id),
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  seller_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_trust (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  reviews_count integer DEFAULT 0,
  successful_transactions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT marketplace_trust_user_unique UNIQUE (user_id)
);

-- ============================================================
-- MESSAGING MODULE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- JOBS MODULE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  salary_min numeric,
  salary_max numeric,
  currency text DEFAULT 'KES',
  job_type text DEFAULT 'full_time' CHECK (job_type IN ('full_time', 'part_time', 'contract', 'freelance', 'internship')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'filled', 'closed', 'draft')),
  skills text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter text,
  resume_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT job_applications_unique UNIQUE (job_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS public.work_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  headline text,
  summary text,
  skills text[],
  experience jsonb DEFAULT '[]',
  education jsonb DEFAULT '[]',
  resume_url text,
  availability text DEFAULT 'immediate' CHECK (availability IN ('immediate', 'two_weeks', 'one_month', 'not_available')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT work_profiles_user_unique UNIQUE (user_id)
);

-- ============================================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================================
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_trust ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BASIC RLS POLICIES (Users can only access their own data)
-- ============================================================
-- Wallet
CREATE POLICY "Users can view own wallet" ON public.wallet_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallet_accounts FOR UPDATE USING (auth.uid() = user_id);

-- Wallet transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.wallet_accounts WHERE id = account_id)
);

-- Messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own read status" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Jobs
CREATE POLICY "Anyone can view active jobs" ON public.jobs FOR SELECT USING (status = 'active');
CREATE POLICY "Employers can manage own jobs" ON public.jobs FOR ALL USING (auth.uid() = employer_id);

-- Job applications
CREATE POLICY "Applicants can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Employers can view applications for their jobs" ON public.job_applications FOR SELECT USING (
  auth.uid() IN (SELECT employer_id FROM public.jobs WHERE id = job_id)
);

-- Marketplace listings
CREATE POLICY "Anyone can view active listings" ON public.marketplace_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can manage own listings" ON public.marketplace_listings FOR ALL USING (auth.uid() = seller_id);

-- Marketplace orders
CREATE POLICY "Users can view own orders" ON public.marketplace_orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Education
CREATE POLICY "Anyone can view active courses" ON public.education_courses FOR SELECT USING (status = 'active');
CREATE POLICY "Students can view own enrollments" ON public.education_enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can view own grades" ON public.education_grades FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Anyone can view resources" ON public.education_resources FOR SELECT USING (true);
CREATE POLICY "Anyone can view timetable" ON public.education_timetable FOR SELECT USING (true);

-- Work profiles
CREATE POLICY "Users can manage own work profile" ON public.work_profiles FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user ON public.wallet_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_account ON public.wallet_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON public.marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON public.marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_education_enrollments_student ON public.education_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_education_enrollments_course ON public.education_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_education_grades_student ON public.education_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_education_grades_exam ON public.education_grades(exam_id);
