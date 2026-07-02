-- ============================================================
-- MTAA EDUCATION MODULE V2
-- Lessons: public worldwide, monetized per view
-- Announcements: localized by authority level
-- ============================================================

-- 1. education_institutions
CREATE TABLE IF NOT EXISTS education_institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('primary', 'secondary', 'tertiary', 'vocational', 'special')),
  level text NOT NULL DEFAULT 'school',
  parent_id uuid REFERENCES education_institutions(id) ON DELETE SET NULL,
  address text,
  district text,
  county text,
  state text,
  country text DEFAULT 'Kenya',
  latitude numeric,
  longitude numeric,
  phone text,
  email text,
  website text,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. education_staff
CREATE TABLE IF NOT EXISTS education_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('teacher', 'principal', 'deputy', 'admin', 'support', 'minister')),
  department text,
  subjects text[],
  bio text,
  is_verified boolean DEFAULT false,
  authority_level text NOT NULL DEFAULT 'school' CHECK (authority_level IN ('school', 'district', 'county', 'state', 'national')),
  can_post_lesson boolean DEFAULT true,
  can_post_announcement boolean DEFAULT true,
  earnings_balance numeric DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, institution_id)
);

-- 3. education_lessons (PUBLIC WORLDWIDE — monetized)
CREATE TABLE IF NOT EXISTS education_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES education_staff(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content text NOT NULL,
  video_url text,
  video_duration integer, -- seconds
  thumbnail_url text,
  document_urls text[],
  subject text NOT NULL,
  class_level text NOT NULL, -- e.g. 'Form 3', 'Grade 7', 'University Year 2'
  curriculum text, -- e.g. 'CBC', '8-4-4', 'IGCSE', 'IB'
  language text DEFAULT 'en',
  tags text[],
  is_published boolean DEFAULT false,
  is_premium boolean DEFAULT false, -- paid lesson
  price numeric DEFAULT 0, -- in local currency
  views_count integer DEFAULT 0,
  unique_views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  earnings_total numeric DEFAULT 0, -- total earned from this lesson
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. education_announcements (LOCALIZED)
CREATE TABLE IF NOT EXISTS education_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES education_staff(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text DEFAULT 'text' CHECK (media_type IN ('text', 'image', 'video', 'document')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned boolean DEFAULT false,
  visibility_scope text NOT NULL DEFAULT 'school' CHECK (visibility_scope IN ('school', 'district', 'county', 'state', 'national')),
  target_roles text[], -- e.g. ['student', 'teacher', 'parent']
  expiry_date timestamptz,
  read_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. education_lesson_views (for earnings tracking)
CREATE TABLE IF NOT EXISTS education_lesson_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES education_lessons(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_type text DEFAULT 'anonymous' CHECK (viewer_type IN ('student', 'teacher', 'anonymous')),
  watch_duration integer DEFAULT 0, -- seconds watched
  is_unique boolean DEFAULT true,
  earnings_generated numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. education_lesson_likes
CREATE TABLE IF NOT EXISTS education_lesson_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES education_lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);

-- 7. education_lesson_comments
CREATE TABLE IF NOT EXISTS education_lesson_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES education_lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_teacher_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. education_purchases (for premium lessons)
CREATE TABLE IF NOT EXISTS education_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES education_lessons(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  teacher_share numeric NOT NULL, -- 70% to teacher
  platform_fee numeric NOT NULL, -- 30% to MTAA
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(lesson_id, buyer_id)
);

-- 9. education_earnings_transactions
CREATE TABLE IF NOT EXISTS education_earnings_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES education_staff(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES education_lessons(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('view', 'purchase', 'bonus', 'withdrawal')),
  amount numeric NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 10. education_students
CREATE TABLE IF NOT EXISTS education_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  institution_id uuid NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  admission_number text NOT NULL,
  class_level text NOT NULL,
  stream text,
  year_of_study integer,
  parent_contact text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(admission_number, institution_id)
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Lessons: PUBLIC READ (worldwide), staff write own
ALTER TABLE education_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_public_read" ON education_lessons FOR SELECT USING (is_published = true);
CREATE POLICY "lessons_staff_write" ON education_lessons FOR ALL USING (
  staff_id IN (SELECT id FROM education_staff WHERE user_id = auth.uid())
);

-- Announcements: LOCALIZED READ
ALTER TABLE education_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_localized_read" ON education_announcements FOR SELECT USING (
  CASE visibility_scope
    WHEN 'national' THEN true
    WHEN 'state' THEN (
      EXISTS (SELECT 1 FROM education_staff WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM education_students WHERE user_id = auth.uid())
    )
    WHEN 'county' THEN (
      EXISTS (
        SELECT 1 FROM education_staff s
        JOIN education_institutions i ON s.institution_id = i.id
        JOIN education_institutions fi ON education_announcements.institution_id = fi.id
        WHERE s.user_id = auth.uid() AND i.county = fi.county
      ) OR EXISTS (
        SELECT 1 FROM education_students s
        JOIN education_institutions i ON s.institution_id = i.id
        JOIN education_institutions fi ON education_announcements.institution_id = fi.id
        WHERE s.user_id = auth.uid() AND i.county = fi.county
      )
    )
    WHEN 'district' THEN (
      EXISTS (
        SELECT 1 FROM education_staff s
        JOIN education_institutions i ON s.institution_id = i.id
        JOIN education_institutions fi ON education_announcements.institution_id = fi.id
        WHERE s.user_id = auth.uid() AND i.district = fi.district
      ) OR EXISTS (
        SELECT 1 FROM education_students s
        JOIN education_institutions i ON s.institution_id = i.id
        JOIN education_institutions fi ON education_announcements.institution_id = fi.id
        WHERE s.user_id = auth.uid() AND i.district = fi.district
      )
    )
    WHEN 'school' THEN (
      EXISTS (SELECT 1 FROM education_staff WHERE user_id = auth.uid() AND institution_id = education_announcements.institution_id) OR
      EXISTS (SELECT 1 FROM education_students WHERE user_id = auth.uid() AND institution_id = education_announcements.institution_id)
    )
    ELSE false
  END
);
CREATE POLICY "announcements_staff_write" ON education_announcements FOR ALL USING (
  staff_id IN (SELECT id FROM education_staff WHERE user_id = auth.uid())
);

-- Lesson views: write by viewer, read by teacher
ALTER TABLE education_lesson_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views_public_write" ON education_lesson_views FOR INSERT WITH CHECK (true);
CREATE POLICY "views_teacher_read" ON education_lesson_views FOR SELECT USING (
  lesson_id IN (
    SELECT id FROM education_lessons
    WHERE staff_id IN (SELECT id FROM education_staff WHERE user_id = auth.uid())
  )
);

-- Lesson likes/comments: public
ALTER TABLE education_lesson_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_likes_public" ON education_lesson_likes FOR ALL USING (user_id = auth.uid());

ALTER TABLE education_lesson_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_comments_public_read" ON education_lesson_comments FOR SELECT USING (true);
CREATE POLICY "lesson_comments_public_write" ON education_lesson_comments FOR ALL USING (user_id = auth.uid());

-- Purchases: buyer + teacher can read
ALTER TABLE education_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_buyer_read" ON education_purchases FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "purchases_teacher_read" ON education_purchases FOR SELECT USING (
  lesson_id IN (
    SELECT id FROM education_lessons
    WHERE staff_id IN (SELECT id FROM education_staff WHERE user_id = auth.uid())
  )
);

-- Earnings: staff own
ALTER TABLE education_earnings_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "earnings_staff_read" ON education_earnings_transactions FOR SELECT USING (
  staff_id IN (SELECT id FROM education_staff WHERE user_id = auth.uid())
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON education_lessons(subject, class_level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON education_lessons(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_staff ON education_lessons(staff_id);
CREATE INDEX IF NOT EXISTS idx_lesson_views_lesson ON education_lesson_views(lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_views_viewer ON education_lesson_views(lesson_id, viewer_id);
CREATE INDEX IF NOT EXISTS idx_announcements_scope ON education_announcements(visibility_scope, institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON education_announcements(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_user ON education_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_lesson ON education_purchases(lesson_id);
CREATE INDEX IF NOT EXISTS idx_earnings_staff ON education_earnings_transactions(staff_id);

-- ============================================================
-- FUNCTIONS: EARNINGS & ANALYTICS
-- ============================================================

-- Record a lesson view and generate earnings
CREATE OR REPLACE FUNCTION record_lesson_view(
  p_lesson_id uuid,
  p_viewer_id uuid DEFAULT NULL,
  p_watch_duration integer DEFAULT 0
)
RETURNS numeric AS $$
DECLARE
  v_is_unique boolean;
  v_earnings numeric;
  v_staff_id uuid;
  v_existing_view uuid;
BEGIN
  -- Check if unique view (first time this viewer sees this lesson)
  IF p_viewer_id IS NOT NULL THEN
    SELECT id INTO v_existing_view
    FROM education_lesson_views
    WHERE lesson_id = p_lesson_id AND viewer_id = p_viewer_id
    LIMIT 1;
    v_is_unique := (v_existing_view IS NULL);
  ELSE
    v_is_unique := true;
  END IF;

  -- Calculate earnings: KES 0.50 per unique view, KES 0.10 per repeat view
  IF v_is_unique THEN
    v_earnings := 0.50;
  ELSE
    v_earnings := 0.10;
  END IF;

  -- Get staff_id from lesson
  SELECT staff_id INTO v_staff_id FROM education_lessons WHERE id = p_lesson_id;

  -- Insert view record
  INSERT INTO education_lesson_views (lesson_id, viewer_id, watch_duration, is_unique, earnings_generated)
  VALUES (p_lesson_id, p_viewer_id, p_watch_duration, v_is_unique, v_earnings);

  -- Update lesson stats
  UPDATE education_lessons SET
    views_count = views_count + 1,
    unique_views_count = unique_views_count + CASE WHEN v_is_unique THEN 1 ELSE 0 END,
    earnings_total = earnings_total + v_earnings
  WHERE id = p_lesson_id;

  -- Update teacher earnings
  IF v_staff_id IS NOT NULL THEN
    UPDATE education_staff SET
      earnings_balance = earnings_balance + v_earnings,
      total_earnings = total_earnings + v_earnings
    WHERE id = v_staff_id;

    -- Record transaction
    INSERT INTO education_earnings_transactions (staff_id, lesson_id, type, amount, description)
    VALUES (v_staff_id, p_lesson_id, 'view', v_earnings,
      CASE WHEN v_is_unique THEN 'Unique view' ELSE 'Repeat view' END);
  END IF;

  RETURN v_earnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process premium lesson purchase
CREATE OR REPLACE FUNCTION purchase_lesson(p_lesson_id uuid, p_buyer_id uuid)
RETURNS boolean AS $$
DECLARE
  v_lesson_price numeric;
  v_staff_id uuid;
  v_teacher_share numeric;
  v_platform_fee numeric;
BEGIN
  SELECT price, staff_id INTO v_lesson_price, v_staff_id
  FROM education_lessons WHERE id = p_lesson_id AND is_premium = true;

  IF v_lesson_price IS NULL OR v_lesson_price <= 0 THEN
    RETURN false;
  END IF;

  v_teacher_share := v_lesson_price * 0.70;
  v_platform_fee := v_lesson_price * 0.30;

  -- Record purchase
  INSERT INTO education_purchases (lesson_id, buyer_id, amount, teacher_share, platform_fee)
  VALUES (p_lesson_id, p_buyer_id, v_lesson_price, v_teacher_share, v_platform_fee);

  -- Credit teacher
  UPDATE education_staff SET
    earnings_balance = earnings_balance + v_teacher_share,
    total_earnings = total_earnings + v_teacher_share
  WHERE id = v_staff_id;

  -- Record transaction
  INSERT INTO education_earnings_transactions (staff_id, lesson_id, type, amount, description)
  VALUES (v_staff_id, p_lesson_id, 'purchase', v_teacher_share,
    'Premium lesson purchase by ' || p_buyer_id);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get teacher earnings dashboard
CREATE OR REPLACE FUNCTION get_teacher_earnings(p_staff_id uuid)
RETURNS TABLE (
  total_earnings numeric,
  current_balance numeric,
  total_views bigint,
  total_unique_views bigint,
  total_purchases bigint,
  top_lesson uuid,
  top_lesson_earnings numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.total_earnings,
    s.earnings_balance,
    COALESCE(SUM(l.views_count), 0)::bigint,
    COALESCE(SUM(l.unique_views_count), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM education_purchases p
      JOIN education_lessons ls ON p.lesson_id = ls.id WHERE ls.staff_id = p_staff_id), 0)::bigint,
    (SELECT id FROM education_lessons WHERE staff_id = p_staff_id ORDER BY earnings_total DESC LIMIT 1),
    COALESCE((SELECT earnings_total FROM education_lessons WHERE staff_id = p_staff_id ORDER BY earnings_total DESC LIMIT 1), 0)
  FROM education_staff s
  LEFT JOIN education_lessons l ON l.staff_id = s.id
  WHERE s.id = p_staff_id
  GROUP BY s.total_earnings, s.earnings_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get localized announcements for user
CREATE OR REPLACE FUNCTION get_localized_announcements(p_user_id uuid)
RETURNS TABLE (
  id uuid, staff_id uuid, institution_id uuid, title text, content text,
  media_url text, media_type text, priority text, is_pinned boolean,
  visibility_scope text, read_count integer, created_at timestamptz,
  staff_name text, institution_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id, a.staff_id, a.institution_id, a.title, a.content,
    a.media_url, a.media_type, a.priority, a.is_pinned,
    a.visibility_scope, a.read_count, a.created_at,
    p.full_name as staff_name,
    i.name as institution_name
  FROM education_announcements a
  JOIN education_staff s ON a.staff_id = s.id
  JOIN user_profiles p ON s.user_id = p.user_id
  JOIN education_institutions i ON a.institution_id = i.id
  WHERE
    -- National: everyone sees
    (a.visibility_scope = 'national')
    OR
    -- State: anyone in education system
    (a.visibility_scope = 'state' AND (
      EXISTS (SELECT 1 FROM education_staff WHERE user_id = p_user_id) OR
      EXISTS (SELECT 1 FROM education_students WHERE user_id = p_user_id)
    ))
    OR
    -- County: same county
    (a.visibility_scope = 'county' AND (
      EXISTS (
        SELECT 1 FROM education_staff es
        JOIN education_institutions ei ON es.institution_id = ei.id
        WHERE es.user_id = p_user_id AND ei.county = i.county
      ) OR EXISTS (
        SELECT 1 FROM education_students est
        JOIN education_institutions ei ON est.institution_id = ei.id
        WHERE est.user_id = p_user_id AND ei.county = i.county
      )
    ))
    OR
    -- District: same district
    (a.visibility_scope = 'district' AND (
      EXISTS (
        SELECT 1 FROM education_staff es
        JOIN education_institutions ei ON es.institution_id = ei.id
        WHERE es.user_id = p_user_id AND ei.district = i.district
      ) OR EXISTS (
        SELECT 1 FROM education_students est
        JOIN education_institutions ei ON est.institution_id = ei.id
        WHERE est.user_id = p_user_id AND ei.district = i.district
      )
    ))
    OR
    -- School: same institution
    (a.visibility_scope = 'school' AND (
      EXISTS (SELECT 1 FROM education_staff WHERE user_id = p_user_id AND institution_id = a.institution_id) OR
      EXISTS (SELECT 1 FROM education_students WHERE user_id = p_user_id AND institution_id = a.institution_id)
    ))
  ORDER BY a.is_pinned DESC, a.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
