-- CREDIT / FINANCE TABLES
CREATE TABLE IF NOT EXISTS credit_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 500,
  tier TEXT DEFAULT 'bronze',
  limit_amount NUMERIC DEFAULT 0,
  used_amount NUMERIC DEFAULT 0,
  available_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  principal NUMERIC NOT NULL,
  interest_rate NUMERIC DEFAULT 12.5,
  term_months INTEGER NOT NULL,
  monthly_payment NUMERIC,
  remaining_balance NUMERIC,
  status TEXT DEFAULT 'pending',
  next_due_date TIMESTAMPTZ,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,
  name TEXT,
  amount NUMERIC,
  return_rate NUMERIC,
  maturity_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  status TEXT DEFAULT 'completed',
  timestamp TIMESTAMPTZ DEFAULT now(),
  counterparty TEXT
);

-- JOBS TABLES
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  type TEXT DEFAULT 'full_time',
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'USD',
  salary_period TEXT DEFAULT 'year',
  description TEXT,
  requirements TEXT[],
  skills TEXT[],
  posted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'open',
  applications INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, user_id)
);

CREATE TABLE IF NOT EXISTS work_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT,
  summary TEXT,
  skills TEXT[],
  availability TEXT DEFAULT 'negotiable',
  preferred_location TEXT,
  expected_salary_min NUMERIC,
  expected_salary_max NUMERIC,
  expected_salary_currency TEXT DEFAULT 'USD',
  verified BOOLEAN DEFAULT false,
  UNIQUE(user_id)
);

-- RLS POLICIES
ALTER TABLE credit_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own credit" ON credit_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own loans" ON loans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own investments" ON investments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own transactions" ON credit_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read jobs" ON jobs FOR SELECT USING (status = 'open');
CREATE POLICY "Employers manage jobs" ON jobs FOR ALL USING (auth.uid() = employer_id);
CREATE POLICY "Users own applications" ON job_applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Employers see applications" ON job_applications FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_applications.job_id AND jobs.employer_id = auth.uid()));
CREATE POLICY "Users own profile" ON work_profiles FOR ALL USING (auth.uid() = user_id);
