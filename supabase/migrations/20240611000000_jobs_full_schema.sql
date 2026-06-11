-- MTAA Jobs Module Full Schema — 22 Tables, RLS, Functions, Triggers
-- Deploy: psql $DATABASE_URL < this_file.sql

-- ============================================================
-- 1. CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.job_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  description text,
  parent_id uuid REFERENCES public.job_categories(id),
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.job_categories(id),
  title text NOT NULL,
  description text NOT NULL,
  requirements text[],
  responsibilities text[],
  type text NOT NULL CHECK (type IN ('full_time','part_time','contract','freelance','internship','apprenticeship','volunteer')),
  experience_level text CHECK (experience_level IN ('entry','mid','senior','executive')),
  salary_min numeric,
  salary_max numeric,
  salary_currency text DEFAULT 'KES',
  location text,
  remote_allowed boolean DEFAULT false,
  skills_required text[],
  benefits text[],
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','paused','closed','filled')),
  featured boolean DEFAULT false,
  featured_until timestamptz,
  views_count int DEFAULT 0,
  applications_count int DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter text,
  resume_url text,
  portfolio_url text,
  expected_salary numeric,
  notice_period_days int,
  status text DEFAULT 'applied' CHECK (status IN ('applied','screening','interview','offer','hired','rejected','withdrawn')),
  source text DEFAULT 'mtaa',
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- ============================================================
-- 2. WORKER PROFILE & SKILLS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline text,
  summary text,
  years_experience int DEFAULT 0,
  current_role text,
  current_company text,
  preferred_job_types text[],
  preferred_locations text[],
  expected_salary_min numeric,
  expected_salary_max numeric,
  available_from date,
  open_to_remote boolean DEFAULT true,
  portfolio_url text,
  resume_url text,
  video_intro_url text,
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles(id),
  completeness_score int DEFAULT 0,
  profile_views int DEFAULT 0,
  search_appearances int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text UNIQUE NOT NULL,
  category text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.worker_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level int NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
  years_experience int DEFAULT 0,
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(worker_profile_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_skill_id uuid NOT NULL REFERENCES public.worker_skills(id) ON DELETE CASCADE,
  endorser_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(worker_skill_id, endorser_id)
);

-- ============================================================
-- 3. PORTFOLIO & CERTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  project_url text,
  thumbnail_url text,
  skills_used text[],
  start_date date,
  end_date date,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text NOT NULL,
  credential_id text,
  credential_url text,
  issue_date date,
  expiry_date date,
  is_verified boolean DEFAULT false,
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. EMPLOYER & COMPANY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  industry text,
  size text CHECK (size IN ('1-10','11-50','51-200','201-500','501-1000','1000+')),
  website text,
  logo_url text,
  cover_image_url text,
  location text,
  verified boolean DEFAULT false,
  verification_documents jsonb,
  rating numeric DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  reviews_count int DEFAULT 0,
  followers_count int DEFAULT 0,
  active_jobs_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','recruiter','viewer')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.company_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- ============================================================
-- 5. APPRENTICESHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.apprenticeships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  title text NOT NULL,
  description text NOT NULL,
  trade text NOT NULL,
  duration_months int NOT NULL,
  stipend_amount numeric,
  stipend_frequency text CHECK (stipend_frequency IN ('weekly','monthly')),
  skills_taught text[],
  certification_offered boolean DEFAULT false,
  mentor_id uuid REFERENCES public.profiles(id),
  slots_available int DEFAULT 1,
  slots_filled int DEFAULT 0,
  requirements text[],
  status text DEFAULT 'open' CHECK (status IN ('open','filled','in_progress','completed','cancelled')),
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprenticeship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenticeship_id uuid NOT NULL REFERENCES public.apprenticeships(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  motivation_letter text,
  status text DEFAULT 'applied' CHECK (status IN ('applied','interview','accepted','rejected','withdrawn')),
  applied_at timestamptz DEFAULT now(),
  UNIQUE(apprenticeship_id, applicant_id)
);

-- ============================================================
-- 6. FREELANCE & CONTRACTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.freelance_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  title text NOT NULL,
  description text NOT NULL,
  category text,
  budget_min numeric,
  budget_max numeric,
  budget_type text CHECK (budget_type IN ('fixed','hourly','milestone')),
  duration text,
  skills_required text[],
  attachments jsonb,
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.freelance_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.freelance_projects(id) ON DELETE CASCADE,
  freelancer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter text,
  proposed_amount numeric,
  proposed_duration text,
  milestones jsonb,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted','shortlisted','accepted','rejected','withdrawn')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, freelancer_id)
);

-- ============================================================
-- 7. CONTRACTS & ESCROW
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('employment','freelance','apprenticeship')),
  job_id uuid REFERENCES public.jobs(id),
  project_id uuid REFERENCES public.freelance_projects(id),
  apprenticeship_id uuid REFERENCES public.apprenticeships(id),
  employer_id uuid NOT NULL REFERENCES public.profiles(id),
  worker_id uuid NOT NULL REFERENCES public.profiles(id),
  company_id uuid REFERENCES public.companies(id),
  title text NOT NULL,
  terms text,
  start_date date,
  end_date date,
  salary_amount numeric,
  salary_frequency text CHECK (salary_frequency IN ('hourly','daily','weekly','monthly','project')),
  status text DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','terminated')),
  signed_by_employer boolean DEFAULT false,
  signed_by_worker boolean DEFAULT false,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  milestone_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'KES',
  status text DEFAULT 'pending' CHECK (status IN ('pending','funded','released','disputed','refunded')),
  funded_by uuid REFERENCES public.profiles(id),
  funded_at timestamptz,
  released_by uuid REFERENCES public.profiles(id),
  released_at timestamptz,
  dispute_reason text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. SCHOLARSHIPS & TENDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  provider_name text NOT NULL,
  description text,
  amount numeric,
  currency text DEFAULT 'KES',
  level text CHECK (level IN ('certificate','diploma','undergraduate','masters','phd','research')),
  field_of_study text,
  coverage text[],
  eligibility text[],
  deadline date,
  application_url text,
  status text DEFAULT 'open' CHECK (status IN ('open','closed','awarded')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  organization_name text NOT NULL,
  organization_type text CHECK (organization_type IN ('government','county','ngo','private','international')),
  description text,
  category text,
  budget_min numeric,
  budget_max numeric,
  currency text DEFAULT 'KES',
  location text,
  requirements text[],
  documents jsonb,
  submission_deadline date,
  status text DEFAULT 'open' CHECK (status IN ('open','under_review','awarded','closed','cancelled')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 9. INTERVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.job_applications(id),
  contract_id uuid REFERENCES public.contracts(id),
  employer_id uuid NOT NULL REFERENCES public.profiles(id),
  candidate_id uuid NOT NULL REFERENCES public.profiles(id),
  type text NOT NULL CHECK (type IN ('video','audio','in_person')),
  title text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int DEFAULT 30,
  meeting_url text,
  location text,
  notes text,
  feedback text,
  rating int CHECK (rating BETWEEN 1 AND 5),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 10. ANALYTICS & AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.job_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view','apply','save','share','click')),
  user_id uuid REFERENCES public.profiles(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprenticeships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprenticeship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelance_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_analytics ENABLE ROW LEVEL SECURITY;

-- Jobs: anyone can view published, employer can manage own
CREATE POLICY "jobs_select_public" ON public.jobs FOR SELECT USING (status = 'published');
CREATE POLICY "jobs_select_owner" ON public.jobs FOR SELECT USING (employer_id = auth.uid());
CREATE POLICY "jobs_insert" ON public.jobs FOR INSERT WITH CHECK (employer_id = auth.uid());
CREATE POLICY "jobs_update" ON public.jobs FOR UPDATE USING (employer_id = auth.uid());
CREATE POLICY "jobs_delete" ON public.jobs FOR DELETE USING (employer_id = auth.uid());

-- Applications: applicant can manage own, employer can view for their jobs
CREATE POLICY "apps_select_applicant" ON public.job_applications FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "apps_select_employer" ON public.job_applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND employer_id = auth.uid()));
CREATE POLICY "apps_insert" ON public.job_applications FOR INSERT WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "apps_update_applicant" ON public.job_applications FOR UPDATE USING (applicant_id = auth.uid());
CREATE POLICY "apps_update_employer" ON public.job_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND employer_id = auth.uid()));

-- Saved jobs
CREATE POLICY "saved_select" ON public.saved_jobs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "saved_insert" ON public.saved_jobs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_delete" ON public.saved_jobs FOR DELETE USING (user_id = auth.uid());

-- Worker profiles: public read, owner write
CREATE POLICY "worker_select_public" ON public.worker_profiles FOR SELECT USING (true);
CREATE POLICY "worker_select_owner" ON public.worker_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "worker_insert" ON public.worker_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "worker_update" ON public.worker_profiles FOR UPDATE USING (user_id = auth.uid());

-- Companies: public read, members write
CREATE POLICY "company_select_public" ON public.companies FOR SELECT USING (true);
CREATE POLICY "company_select_member" ON public.companies FOR SELECT USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_id = id AND user_id = auth.uid()));
CREATE POLICY "company_insert" ON public.companies FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "company_update" ON public.companies FOR UPDATE USING (EXISTS (SELECT 1 FROM public.company_members WHERE company_id = id AND user_id = auth.uid() AND role IN ('owner','admin')));

-- Freelance projects: public read open, owner manage
CREATE POLICY "fp_select_public" ON public.freelance_projects FOR SELECT USING (status = 'open');
CREATE POLICY "fp_select_owner" ON public.freelance_projects FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "fp_insert" ON public.freelance_projects FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "fp_update" ON public.freelance_projects FOR UPDATE USING (client_id = auth.uid());

-- Contracts: both parties can view
CREATE POLICY "contract_select_party" ON public.contracts FOR SELECT USING (employer_id = auth.uid() OR worker_id = auth.uid());
CREATE POLICY "contract_insert" ON public.contracts FOR INSERT WITH CHECK (employer_id = auth.uid());
CREATE POLICY "contract_update_party" ON public.contracts FOR UPDATE USING (employer_id = auth.uid() OR worker_id = auth.uid());

-- Interviews: both parties
CREATE POLICY "interview_select" ON public.interviews FOR SELECT USING (employer_id = auth.uid() OR candidate_id = auth.uid());
CREATE POLICY "interview_insert" ON public.interviews FOR INSERT WITH CHECK (employer_id = auth.uid());
CREATE POLICY "interview_update" ON public.interviews FOR UPDATE USING (employer_id = auth.uid() OR candidate_id = auth.uid());

-- Scholarships & Tenders: public read
CREATE POLICY "scholarship_select" ON public.scholarships FOR SELECT USING (true);
CREATE POLICY "tender_select" ON public.tenders FOR SELECT USING (true);

-- Analytics: insert by anyone, select by admin
CREATE POLICY "analytics_insert" ON public.job_analytics FOR INSERT WITH CHECK (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_job_views(job_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.jobs SET views_count = views_count + 1 WHERE id = job_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_job_applications(job_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.jobs SET applications_count = applications_count + 1 WHERE id = job_id;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER job_applications_updated_at BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER worker_profiles_updated_at BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER interviews_updated_at BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER freelance_projects_updated_at BEFORE UPDATE ON public.freelance_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_jobs_employer ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON public.jobs(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_user ON public.worker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills(name);
CREATE INDEX IF NOT EXISTS idx_worker_skills_profile ON public.worker_skills(worker_profile_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employer ON public.contracts(employer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_worker ON public.contracts(worker_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON public.interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_analytics_job ON public.job_analytics(job_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON public.job_analytics(event_type);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.job_listings AS
SELECT 
  j.*,
  c.name as company_name,
  c.logo_url as company_logo,
  c.verified as company_verified,
  c.rating as company_rating
FROM public.jobs j
LEFT JOIN public.companies c ON j.employer_id = c.owner_id
WHERE j.status = 'published';

CREATE OR REPLACE VIEW public.worker_listings AS
SELECT 
  wp.*,
  p.full_name,
  p.avatar_url,
  p.location
FROM public.worker_profiles wp
JOIN public.profiles p ON wp.user_id = p.id
WHERE wp.verification_status = 'verified';
