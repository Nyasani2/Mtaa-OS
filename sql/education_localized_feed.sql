-- ============================================================
-- MTAA EDUCATION MODULE — Localized Teacher Feed & Announcements
-- Authority levels: school < district < county < state < national
-- ============================================================

-- 1. education_institutions (schools, colleges, universities)
CREATE TABLE IF NOT EXISTS education_institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('primary', 'secondary', 'tertiary', 'vocational', 'special')),
  level text NOT NULL DEFAULT 'school', -- school, district, county, state, national
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

-- 2. education_staff (teachers, admins linked to institutions)
CREATE TABLE IF NOT EXISTS education_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('teacher', 'principal', 'deputy', 'admin', 'support', 'minister')),
  department text,
  subjects text[], -- e.g. ['Mathematics', 'Physics']
  is_verified boolean DEFAULT false,
  authority_level text NOT NULL DEFAULT 'school' CHECK (authority_level IN ('school', 'district', 'county', 'state', 'national')),
  can_post_feed boolean DEFAULT false,
  can_post_announcement boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, institution_id)
);

-- 3. education_feed (teacher posts — localized)
CREATE TABLE IF NOT EXISTS education_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES education_staff(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text DEFAULT 'text' CHECK (media_type IN ('text', 'image', 'video', 'document')),
  subject_tags text[],
  class_level text, -- e.g. 'Form 3', 'Grade 7'
  is_announcement boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  visibility_scope text NOT NULL DEFAULT 'school' CHECK (visibility_scope IN ('school', 'district', 'county', 'state', 'national')),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. education_feed_likes
CREATE TABLE IF NOT EXISTS education_feed_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES education_feed(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(feed_id, user_id)
);

-- 5. education_feed_comments
CREATE TABLE IF NOT EXISTS education_feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES education_feed(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. education_students (enrollment)
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

-- Institutions: public read, admin write
ALTER TABLE education_institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "institutions_public_read" ON education_institutions FOR SELECT USING (true);
CREATE POLICY "institutions_admin_write" ON education_institutions FOR ALL USING (
  EXISTS (SELECT 1 FROM education_staff WHERE user_id = auth.uid() AND role IN ('admin', 'principal', 'minister'))
);

-- Staff: institution members can read, self + admin can write
ALTER TABLE education_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_institution_read" ON education_staff FOR SELECT USING (
  institution_id IN (
    SELECT institution_id FROM education_staff WHERE user_id = auth.uid()
  )
);
CREATE POLICY "staff_self_write" ON education_staff FOR ALL USING (user_id = auth.uid());
CREATE POLICY "staff_admin_write" ON education_staff FOR ALL USING (
  EXISTS (
    SELECT 1 FROM education_staff s
    WHERE s.user_id = auth.uid() AND s.institution_id = education_staff.institution_id
    AND s.role IN ('admin', 'principal', 'minister')
  )
);

-- Feed: localized visibility based on scope + hierarchy
ALTER TABLE education_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_localized_read" ON education_feed FOR SELECT USING (
  -- Can see if visibility matches user's scope
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
        JOIN education_institutions fi ON education_feed.institution_id = fi.id
        WHERE s.user_id = auth.uid() AND i.county = fi.county
      ) OR EXISTS (
        SELECT 1 FROM education_students s
        JOIN education_institutions i ON s.institution_id = i.id
        JOIN education_institutions fi ON education_feed.institution_id = fi.id
        WHERE s.user_id = auth.uid() AND i.county = fi.county
      )
    )
    WHEN 'district' THEN (
      EXISTS (
        SELECT 1 FROM education_staff s
        JOIN education_institutions i ON s.institution_id = i.id
        JOIN education_institutions fi ON education_feed.institution_id = fi.id
        WHERE s.user_id = auth.uid() AND i.district = fi.district
      ) OR EXISTS (
        SELECT 1 FROM education_students s
        JOIN education_institutions i ON s.institution_id = i.id
        JOIN education_institutions fi ON education_feed.institution_id = fi.id
        WHERE s.user_id = auth.uid() AND i.district = fi.district
      )
    )
    WHEN 'school' THEN (
      EXISTS (SELECT 1 FROM education_staff WHERE user_id = auth.uid() AND institution_id = education_feed.institution_id) OR
      EXISTS (SELECT 1 FROM education_students WHERE user_id = auth.uid() AND institution_id = education_feed.institution_id)
    )
    ELSE false
  END
);
CREATE POLICY "feed_staff_write" ON education_feed FOR ALL USING (
  staff_id IN (SELECT id FROM education_staff WHERE user_id = auth.uid())
);

-- Feed likes/comments: same localized rules
ALTER TABLE education_feed_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_likes_read" ON education_feed_likes FOR SELECT USING (true);
CREATE POLICY "feed_likes_write" ON education_feed_likes FOR ALL USING (user_id = auth.uid());

ALTER TABLE education_feed_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_comments_read" ON education_feed_comments FOR SELECT USING (true);
CREATE POLICY "feed_comments_write" ON education_feed_comments FOR ALL USING (user_id = auth.uid());

-- Students: self + institution staff can read
ALTER TABLE education_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_self_read" ON education_students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "students_staff_read" ON education_students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM education_staff
    WHERE user_id = auth.uid() AND institution_id = education_students.institution_id
  )
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_feed_institution ON education_feed(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_visibility ON education_feed(visibility_scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_announcement ON education_feed(is_announcement, institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_pinned ON education_feed(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_user ON education_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_institution ON education_staff(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON education_students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_institution ON education_students(institution_id);
CREATE INDEX IF NOT EXISTS idx_institutions_parent ON education_institutions(parent_id);
CREATE INDEX IF NOT EXISTS idx_institutions_location ON education_institutions(district, county, state);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Get feed for user based on their scope
CREATE OR REPLACE FUNCTION get_localized_feed(p_user_id uuid, p_scope text DEFAULT 'school')
RETURNS TABLE (
  id uuid, staff_id uuid, institution_id uuid, title text, content text,
  media_url text, media_type text, subject_tags text[], class_level text,
  is_announcement boolean, is_pinned boolean, visibility_scope text,
  likes_count integer, comments_count integer, created_at timestamptz,
  staff_name text, institution_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id, f.staff_id, f.institution_id, f.title, f.content,
    f.media_url, f.media_type, f.subject_tags, f.class_level,
    f.is_announcement, f.is_pinned, f.visibility_scope,
    f.likes_count, f.comments_count, f.created_at,
    p.full_name as staff_name,
    i.name as institution_name
  FROM education_feed f
  JOIN education_staff s ON f.staff_id = s.id
  JOIN user_profiles p ON s.user_id = p.user_id
  JOIN education_institutions i ON f.institution_id = i.id
  WHERE f.visibility_scope <= p_scope
    AND (
      -- User is staff at same or child institution
      EXISTS (
        SELECT 1 FROM education_staff es
        JOIN education_institutions ei ON es.institution_id = ei.id
        WHERE es.user_id = p_user_id
        AND (
          ei.id = i.id OR
          ei.parent_id = i.id OR
          i.parent_id = ei.id OR
          (ei.district IS NOT NULL AND ei.district = i.district) OR
          (ei.county IS NOT NULL AND ei.county = i.county)
        )
      )
      OR
      -- User is student at same institution
      EXISTS (
        SELECT 1 FROM education_students st
        WHERE st.user_id = p_user_id AND st.institution_id = i.id
      )
    )
  ORDER BY f.is_pinned DESC, f.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment feed like count
CREATE OR REPLACE FUNCTION increment_edu_feed_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE education_feed SET likes_count = likes_count + 1 WHERE id = NEW.feed_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE education_feed SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.feed_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS edu_feed_like_trigger ON education_feed_likes;
CREATE TRIGGER edu_feed_like_trigger
  AFTER INSERT OR DELETE ON education_feed_likes
  FOR EACH ROW EXECUTE FUNCTION increment_edu_feed_like();

-- Increment feed comment count
CREATE OR REPLACE FUNCTION increment_edu_feed_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE education_feed SET comments_count = comments_count + 1 WHERE id = NEW.feed_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE education_feed SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.feed_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS edu_feed_comment_trigger ON education_feed_comments;
CREATE TRIGGER edu_feed_comment_trigger
  AFTER INSERT OR DELETE ON education_feed_comments
  FOR EACH ROW EXECUTE FUNCTION increment_edu_feed_comment();
