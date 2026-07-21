-- MTAA AppStore Schema — Developer Portal, Reviews, Submissions, Earnings

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. DEVELOPER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS developer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  total_apps INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  total_earnings NUMERIC(12,2) DEFAULT 0,
  available_balance NUMERIC(12,2) DEFAULT 0,
  pending_balance NUMERIC(12,2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_dev_profiles_user ON developer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_profiles_verified ON developer_profiles(verified);

ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_profiles_select_own ON developer_profiles;
DROP POLICY IF EXISTS dev_profiles_insert_own ON developer_profiles;
DROP POLICY IF EXISTS dev_profiles_update_own ON developer_profiles;

CREATE POLICY dev_profiles_select_own ON developer_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY dev_profiles_insert_own ON developer_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY dev_profiles_update_own ON developer_profiles FOR UPDATE USING (user_id = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE developer_profiles; EXCEPTION WHEN duplicate_object THEN END $$;

-- ============================================================
-- 2. APP SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS app_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  screenshots TEXT[] DEFAULT '{}',
  route TEXT,
  permissions TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending_review',
  review_notes TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  version TEXT DEFAULT '1.0.0',
  size_mb INTEGER,
  min_os_version TEXT,
  tags TEXT[] DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_submissions_dev ON app_submissions(developer_id);
CREATE INDEX IF NOT EXISTS idx_app_submissions_status ON app_submissions(status);

ALTER TABLE app_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_submissions_select_own ON app_submissions;
DROP POLICY IF EXISTS app_submissions_insert_own ON app_submissions;
DROP POLICY IF EXISTS app_submissions_update_own ON app_submissions;

CREATE POLICY app_submissions_select_own ON app_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM developer_profiles dp WHERE dp.id = developer_id AND dp.user_id = auth.uid())
);
CREATE POLICY app_submissions_insert_own ON app_submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM developer_profiles dp WHERE dp.id = developer_id AND dp.user_id = auth.uid())
);
CREATE POLICY app_submissions_update_own ON app_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM developer_profiles dp WHERE dp.id = developer_id AND dp.user_id = auth.uid())
);

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE app_submissions; EXCEPTION WHEN duplicate_object THEN END $$;

-- ============================================================
-- 3. APP REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS app_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_reviews_app ON app_reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_app_reviews_user ON app_reviews(user_id);

ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_reviews_select ON app_reviews;
DROP POLICY IF EXISTS app_reviews_insert_own ON app_reviews;
DROP POLICY IF EXISTS app_reviews_update_own ON app_reviews;
DROP POLICY IF EXISTS app_reviews_delete_own ON app_reviews;

CREATE POLICY app_reviews_select ON app_reviews FOR SELECT USING (true);
CREATE POLICY app_reviews_insert_own ON app_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY app_reviews_update_own ON app_reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY app_reviews_delete_own ON app_reviews FOR DELETE USING (user_id = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE app_reviews; EXCEPTION WHEN duplicate_object THEN END $$;

-- ============================================================
-- 4. APP INSTALLS (track downloads per app)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_installs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,
  version TEXT,
  UNIQUE(app_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_installs_app ON app_installs(app_id);
CREATE INDEX IF NOT EXISTS idx_app_installs_user ON app_installs(user_id);

ALTER TABLE app_installs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_installs_select_own ON app_installs;
DROP POLICY IF EXISTS app_installs_insert_own ON app_installs;

CREATE POLICY app_installs_select_own ON app_installs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY app_installs_insert_own ON app_installs FOR INSERT WITH CHECK (user_id = auth.uid());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE app_installs; EXCEPTION WHEN duplicate_object THEN END $$;

-- ============================================================
-- 5. DEVELOPER EARNINGS / TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS developer_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'sale', 'withdrawal', 'refund', 'fee'
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  description TEXT,
  status TEXT DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_transactions_dev ON developer_transactions(developer_id);
CREATE INDEX IF NOT EXISTS idx_dev_transactions_app ON developer_transactions(app_id);

ALTER TABLE developer_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_transactions_select_own ON developer_transactions;

CREATE POLICY dev_transactions_select_own ON developer_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM developer_profiles dp WHERE dp.id = developer_id AND dp.user_id = auth.uid())
);

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE developer_transactions; EXCEPTION WHEN duplicate_object THEN END $$;
