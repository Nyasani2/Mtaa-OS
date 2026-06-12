-- ============================================
-- Phase B5: Resource Library SQL
-- Tables: education_resources, education_resource_collections, education_resource_access_logs
-- ============================================

-- education_resources
CREATE TABLE IF NOT EXISTS education_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES education_teachers(id) ON DELETE SET NULL,
  class_id UUID REFERENCES education_classes_v2(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES education_subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document','video','audio','image','link','lesson_plan','worksheet','presentation','code','book','article')),
  file_url TEXT,
  file_size_bytes BIGINT,
  file_mime_type TEXT,
  external_url TEXT,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  grade_level INTEGER,
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  license_type TEXT DEFAULT 'standard' CHECK (license_type IN ('standard','creative_commons','open_source','proprietary','mtaa_tv')),
  collection_id UUID REFERENCES education_resource_collections(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','archived','pending_review','rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- education_resource_collections
CREATE TABLE IF NOT EXISTS education_resource_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES education_institutions(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES education_teachers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  resource_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- education_resource_access_logs
CREATE TABLE IF NOT EXISTS education_resource_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES education_resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_type TEXT CHECK (user_type IN ('student','teacher','guardian','admin')),
  action TEXT NOT NULL CHECK (action IN ('view','download','share','bookmark')),
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_institution ON education_resources(institution_id);
CREATE INDEX IF NOT EXISTS idx_resources_teacher ON education_resources(teacher_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON education_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_collection ON education_resources(collection_id);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON education_resources USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_collections_institution ON education_resource_collections(institution_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON education_resource_access_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON education_resource_access_logs(user_id);

-- RLS Policies
ALTER TABLE education_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_resource_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_resource_access_logs ENABLE ROW LEVEL SECURITY;

-- Resources: public + institution members
CREATE POLICY "resources_read" ON education_resources
  FOR SELECT USING (
    is_public = true
    OR status = 'active'
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_resources.institution_id AND i.admin_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_teachers t WHERE t.institution_id = education_resources.institution_id AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_students s
      JOIN education_class_enrollments ce ON ce.student_id = s.id
      WHERE ce.class_id = education_resources.class_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "resources_write_teacher" ON education_resources
  FOR ALL USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_resources.institution_id AND i.admin_id = auth.uid()
    )
  );

-- Collections
CREATE POLICY "collections_read" ON education_resource_collections
  FOR SELECT USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM education_teachers t WHERE t.institution_id = education_resource_collections.institution_id AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM education_students s
      JOIN education_class_enrollments ce ON ce.student_id = s.id
      JOIN education_classes_v2 c ON c.id = ce.class_id
      WHERE c.institution_id = education_resource_collections.institution_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "collections_write_teacher" ON education_resource_collections
  FOR ALL USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM education_institutions i WHERE i.id = education_resource_collections.institution_id AND i.admin_id = auth.uid()
    )
  );

-- Access logs: users see their own, teachers see their resources
CREATE POLICY "access_logs_read" ON education_resource_access_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM education_resources r WHERE r.id = education_resource_access_logs.resource_id AND r.teacher_id = auth.uid()
    )
  );

-- Update resource count trigger
CREATE OR REPLACE FUNCTION update_collection_resource_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.collection_id IS NOT NULL THEN
    UPDATE education_resource_collections SET resource_count = resource_count + 1 WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.collection_id IS DISTINCT FROM NEW.collection_id THEN
    IF OLD.collection_id IS NOT NULL THEN
      UPDATE education_resource_collections SET resource_count = resource_count - 1 WHERE id = OLD.collection_id;
    END IF;
    IF NEW.collection_id IS NOT NULL THEN
      UPDATE education_resource_collections SET resource_count = resource_count + 1 WHERE id = NEW.collection_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.collection_id IS NOT NULL THEN
    UPDATE education_resource_collections SET resource_count = resource_count - 1 WHERE id = OLD.collection_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS collection_count_trigger ON education_resources;
CREATE TRIGGER collection_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON education_resources
  FOR EACH ROW EXECUTE FUNCTION update_collection_resource_count();
