-- ============================================================
-- PHASE E: FEED + STUDENT FINANCE
-- 6 tables + 7 auto-triggers + RLS + realtime
-- ============================================================

-- 1. EDUCATION FEED (social + academic posts)
CREATE TABLE IF NOT EXISTS education_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('student','teacher','parent','admin')),
  post_type text NOT NULL CHECK (post_type IN ('announcement','achievement','assignment_reminder','event','praise','general')),
  title text NOT NULL,
  body text,
  media_urls text[] DEFAULT '{}',
  tagged_class_ids uuid[] DEFAULT '{}',
  tagged_student_ids uuid[] DEFAULT '{}',
  likes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  shares_count int DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  visibility text NOT NULL DEFAULT 'school' CHECK (visibility IN ('public','school','class','private')),
  scheduled_at timestamptz,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. FEED ENGAGEMENT (likes, comments, shares)
CREATE TABLE IF NOT EXISTS feed_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid REFERENCES education_feed(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  engagement_type text NOT NULL CHECK (engagement_type IN ('like','comment','share','save')),
  comment_text text,
  parent_comment_id uuid REFERENCES feed_engagement(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(feed_id, user_id, engagement_type) WHERE engagement_type = 'like'
);

-- 3. STUDENT FINANCE ACCOUNTS (per-student wallet within education)
CREATE TABLE IF NOT EXISTS student_finance_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  parent_wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  balance numeric(12,2) DEFAULT 0,
  total_fees_due numeric(12,2) DEFAULT 0,
  total_fees_paid numeric(12,2) DEFAULT 0,
  total_bursaries numeric(12,2) DEFAULT 0,
  total_savings numeric(12,2) DEFAULT 0,
  savings_goal numeric(12,2) DEFAULT 0,
  savings_goal_name text,
  auto_save_percent numeric(5,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','graduated')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. FEE STRUCTURES (school-defined fees per grade/class)
CREATE TABLE IF NOT EXISTS fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  grade_id uuid REFERENCES grades(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  fee_name text NOT NULL,
  fee_type text NOT NULL CHECK (fee_type IN ('tuition','boarding','transport','activity','exam','library','lab','development','other')),
  amount numeric(12,2) NOT NULL,
  frequency text NOT NULL DEFAULT 'term' CHECK (frequency IN ('once','term','year','month')),
  due_date date,
  is_mandatory boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. FEE TRANSACTIONS (payments + bursary allocations)
CREATE TABLE IF NOT EXISTS fee_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES student_finance_accounts(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  fee_structure_id uuid REFERENCES fee_structures(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('fee_charge','payment','bursary','savings_deposit','savings_withdrawal','refund','penalty')),
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'KES',
  payment_method text CHECK (payment_method IN ('wallet','mpesa','bank','cash','bursary')),
  payment_reference text,
  description text,
  term text,
  year int,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','reversed')),
  processed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. BURSARY APPLICATIONS
CREATE TABLE IF NOT EXISTS bursary_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  applicant_type text NOT NULL DEFAULT 'parent' CHECK (applicant_type IN ('parent','student','guardian')),
  applicant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  bursary_type text NOT NULL CHECK (bursary_type IN ('merit','need','sports','arts','disability','orphan','other')),
  amount_requested numeric(12,2) NOT NULL,
  amount_approved numeric(12,2),
  reason text NOT NULL,
  supporting_docs text[] DEFAULT '{}',
  household_income numeric(12,2),
  household_size int,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','approved','rejected','disbursed')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_feed_school ON education_feed(school_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_author ON education_feed(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_type ON education_feed(post_type);
CREATE INDEX IF NOT EXISTS idx_feed_pinned ON education_feed(school_id, is_pinned DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_feed ON feed_engagement(feed_id, engagement_type);
CREATE INDEX IF NOT EXISTS idx_student_finance_student ON student_finance_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_structure_school ON fee_structures(school_id, grade_id);
CREATE INDEX IF NOT EXISTS idx_fee_tx_account ON fee_transactions(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_tx_student ON fee_transactions(student_id, term, year);
CREATE INDEX IF NOT EXISTS idx_bursary_student ON bursary_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_bursary_status ON bursary_applications(school_id, status);

-- ============================================================
-- AUTO-TRIGGERS (7)
-- ============================================================

-- T1: Update engagement counts on like/comment/share
CREATE OR REPLACE FUNCTION update_feed_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.engagement_type = 'like' THEN
      UPDATE education_feed SET likes_count = likes_count + 1 WHERE id = NEW.feed_id;
    ELSIF NEW.engagement_type = 'comment' THEN
      UPDATE education_feed SET comments_count = comments_count + 1 WHERE id = NEW.feed_id;
    ELSIF NEW.engagement_type = 'share' THEN
      UPDATE education_feed SET shares_count = shares_count + 1 WHERE id = NEW.feed_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.engagement_type = 'like' THEN
      UPDATE education_feed SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.feed_id;
    ELSIF OLD.engagement_type = 'comment' THEN
      UPDATE education_feed SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.feed_id;
    ELSIF OLD.engagement_type = 'share' THEN
      UPDATE education_feed SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.feed_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feed_engagement ON feed_engagement;
CREATE TRIGGER trg_feed_engagement
  AFTER INSERT OR DELETE ON feed_engagement
  FOR EACH ROW EXECUTE FUNCTION update_feed_engagement_counts();

-- T2: Auto-create student finance account on student registration
CREATE OR REPLACE FUNCTION auto_create_student_finance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_finance_accounts (student_id, school_id, parent_wallet_id)
  VALUES (
    NEW.id,
    NEW.school_id,
    (SELECT wallet_id FROM profiles WHERE id = NEW.parent_id)
  )
  ON CONFLICT (student_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_student_finance ON students;
CREATE TRIGGER trg_auto_student_finance
  AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION auto_create_student_finance();

-- T3: Auto-calculate fee totals on transaction
CREATE OR REPLACE FUNCTION update_student_finance_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_fees_due numeric(12,2);
  v_fees_paid numeric(12,2);
  v_bursaries numeric(12,2);
  v_savings numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO v_fees_due
  FROM fee_transactions
  WHERE account_id = NEW.account_id AND transaction_type = 'fee_charge' AND status = 'completed';

  SELECT COALESCE(SUM(amount),0) INTO v_fees_paid
  FROM fee_transactions
  WHERE account_id = NEW.account_id AND transaction_type = 'payment' AND status = 'completed';

  SELECT COALESCE(SUM(amount),0) INTO v_bursaries
  FROM fee_transactions
  WHERE account_id = NEW.account_id AND transaction_type = 'bursary' AND status = 'completed';

  SELECT COALESCE(SUM(CASE WHEN transaction_type = 'savings_deposit' THEN amount ELSE -amount END),0)
  INTO v_savings
  FROM fee_transactions
  WHERE account_id = NEW.account_id AND transaction_type IN ('savings_deposit','savings_withdrawal') AND status = 'completed';

  UPDATE student_finance_accounts SET
    total_fees_due = v_fees_due,
    total_fees_paid = v_fees_paid,
    total_bursaries = v_bursaries,
    total_savings = v_savings,
    balance = v_fees_paid + v_bursaries - v_fees_due + v_savings,
    updated_at = now()
  WHERE id = NEW.account_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_finance_totals ON fee_transactions;
CREATE TRIGGER trg_finance_totals
  AFTER INSERT OR UPDATE OF status ON fee_transactions
  FOR EACH ROW WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_student_finance_totals();

-- T4: Auto-apply bursary to fee balance on approval
CREATE OR REPLACE FUNCTION auto_apply_bursary()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id uuid;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    SELECT id INTO v_account_id FROM student_finance_accounts WHERE student_id = NEW.student_id;
    IF v_account_id IS NOT NULL THEN
      INSERT INTO fee_transactions (account_id, student_id, school_id, transaction_type, amount, payment_method, description, status)
      VALUES (v_account_id, NEW.student_id, NEW.school_id, 'bursary', NEW.amount_approved, 'bursary', 'Bursary: ' || NEW.bursary_type, 'completed');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_bursary ON bursary_applications;
CREATE TRIGGER trg_auto_bursary
  AFTER UPDATE OF status ON bursary_applications
  FOR EACH ROW EXECUTE FUNCTION auto_apply_bursary();

-- T5: Auto-savings on payment (if auto_save_percent > 0)
CREATE OR REPLACE FUNCTION auto_savings_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_auto_percent numeric(5,2);
  v_savings_amount numeric(12,2);
BEGIN
  IF NEW.transaction_type = 'payment' AND NEW.status = 'completed' THEN
    SELECT auto_save_percent INTO v_auto_percent
    FROM student_finance_accounts WHERE id = NEW.account_id;
    IF v_auto_percent > 0 THEN
      v_savings_amount := ROUND(NEW.amount * v_auto_percent / 100, 2);
      IF v_savings_amount > 0 THEN
        INSERT INTO fee_transactions (account_id, student_id, school_id, transaction_type, amount, description, status)
        VALUES (NEW.account_id, NEW.student_id, NEW.school_id, 'savings_deposit', v_savings_amount, 'Auto-savings ' || v_auto_percent || '%', 'completed');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_savings ON fee_transactions;
CREATE TRIGGER trg_auto_savings
  AFTER INSERT ON fee_transactions
  FOR EACH ROW EXECUTE FUNCTION auto_savings_on_payment();

-- T6: Notify on fee due (7 days before)
CREATE OR REPLACE FUNCTION notify_fee_due()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date IS NOT NULL AND NEW.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN
    PERFORM pg_notify('fee_due', json_build_object(
      'fee_id', NEW.id,
      'school_id', NEW.school_id,
      'fee_name', NEW.fee_name,
      'amount', NEW.amount,
      'due_date', NEW.due_date
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fee_due ON fee_structures;
CREATE TRIGGER trg_fee_due
  AFTER INSERT OR UPDATE OF due_date ON fee_structures
  FOR EACH ROW EXECUTE FUNCTION notify_fee_due();

-- T7: Update feed updated_at on engagement
CREATE OR REPLACE FUNCTION update_feed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE education_feed SET updated_at = now() WHERE id = COALESCE(NEW.feed_id, OLD.feed_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feed_update ON feed_engagement;
CREATE TRIGGER trg_feed_update
  AFTER INSERT OR DELETE ON feed_engagement
  FOR EACH ROW EXECUTE FUNCTION update_feed_timestamp();

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE education_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bursary_applications ENABLE ROW LEVEL SECURITY;

-- education_feed
CREATE POLICY feed_select ON education_feed FOR SELECT USING (
  visibility = 'public' OR
  (visibility = 'school' AND school_id IN (SELECT school_id FROM students WHERE parent_id = auth.uid())) OR
  (visibility = 'school' AND school_id IN (SELECT school_id FROM teachers WHERE user_id = auth.uid())) OR
  author_id = auth.uid() OR
  auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = education_feed.school_id)
);
CREATE POLICY feed_insert ON education_feed FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY feed_update ON education_feed FOR UPDATE USING (author_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = education_feed.school_id));
CREATE POLICY feed_delete ON education_feed FOR DELETE USING (author_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = education_feed.school_id));

-- feed_engagement
CREATE POLICY engagement_select ON feed_engagement FOR SELECT USING (true);
CREATE POLICY engagement_insert ON feed_engagement FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY engagement_delete ON feed_engagement FOR DELETE USING (user_id = auth.uid());

-- student_finance_accounts
CREATE POLICY finance_select ON student_finance_accounts FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()) OR
  student_id IN (SELECT id FROM students WHERE id IN (SELECT student_id FROM student_guardians WHERE guardian_id = auth.uid())) OR
  auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = student_finance_accounts.school_id)
);
CREATE POLICY finance_update ON student_finance_accounts FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = student_finance_accounts.school_id)
);

-- fee_structures
CREATE POLICY fee_struct_select ON fee_structures FOR SELECT USING (true);
CREATE POLICY fee_struct_admin ON fee_structures FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = fee_structures.school_id)
);

-- fee_transactions
CREATE POLICY fee_tx_select ON fee_transactions FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()) OR
  auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = fee_transactions.school_id)
);
CREATE POLICY fee_tx_admin ON fee_transactions FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = fee_transactions.school_id)
);

-- bursary_applications
CREATE POLICY bursary_select ON bursary_applications FOR SELECT USING (
  applicant_id = auth.uid() OR
  student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()) OR
  auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = bursary_applications.school_id)
);
CREATE POLICY bursary_insert ON bursary_applications FOR INSERT WITH CHECK (applicant_id = auth.uid());
CREATE POLICY bursary_admin ON bursary_applications FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM school_admins WHERE school_id = bursary_applications.school_id)
);

-- ============================================================
-- REALTIME
-- ============================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE education_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_engagement;
ALTER PUBLICATION supabase_realtime ADD TABLE student_finance_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE fee_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE bursary_applications;
