-- ============================================================
-- MTAA Storage Engine Schema
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS storage_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT NOT NULL,
  path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  app_id TEXT,
  public_url TEXT,
  cdn_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  virus_scanned BOOLEAN DEFAULT false,
  scan_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(bucket_id, path)
);

CREATE INDEX IF NOT EXISTS idx_storage_files_owner ON storage_files(owner_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_bucket ON storage_files(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_app ON storage_files(app_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_created ON storage_files(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_files_deleted ON storage_files(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS storage_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES storage_files(id) ON DELETE CASCADE,
  granted_to TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_permissions_file ON storage_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_storage_permissions_granted ON storage_permissions(granted_to);
CREATE INDEX IF NOT EXISTS idx_storage_permissions_expires ON storage_permissions(expires_at);

CREATE TABLE IF NOT EXISTS storage_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES storage_files(id) ON DELETE CASCADE,
  accessed_by TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('read', 'write', 'delete', 'share')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_logs_file ON storage_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_storage_logs_accessed ON storage_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_storage_logs_created ON storage_access_logs(created_at);

CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bytes BIGINT NOT NULL DEFAULT 1073741824,
  file_count_limit INTEGER DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own files"
  ON storage_files FOR SELECT USING (owner_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can insert their own files"
  ON storage_files FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own files"
  ON storage_files FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own files"
  ON storage_files FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Users can view permissions on their files"
  ON storage_permissions FOR SELECT USING (EXISTS (
    SELECT 1 FROM storage_files f WHERE f.id = file_id AND f.owner_id = auth.uid()
  ));

CREATE POLICY "File owners can manage permissions"
  ON storage_permissions FOR ALL USING (EXISTS (
    SELECT 1 FROM storage_files f WHERE f.id = file_id AND f.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view logs for their files"
  ON storage_access_logs FOR SELECT USING (EXISTS (
    SELECT 1 FROM storage_files f WHERE f.id = file_id AND f.owner_id = auth.uid()
  ));

CREATE POLICY "System can insert logs"
  ON storage_access_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own quota"
  ON storage_quotas FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own quota"
  ON storage_quotas FOR UPDATE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO storage_quotas (user_id, total_bytes, file_count_limit)
  VALUES (NEW.id, 1073741824, 10000)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_storage ON auth.users;
CREATE TRIGGER on_auth_user_created_storage
  AFTER INSERT ON auth.users FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_storage_quota();

CREATE OR REPLACE FUNCTION public.update_storage_quota_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE storage_quotas SET updated_at = now() WHERE user_id = NEW.owner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_storage_quota_insert ON storage_files;
CREATE TRIGGER trg_storage_quota_insert
  AFTER INSERT ON storage_files FOR EACH ROW
  EXECUTE FUNCTION public.update_storage_quota_on_insert();

CREATE OR REPLACE FUNCTION public.cleanup_temp_files(max_age_hours INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER := 0; rec RECORD;
BEGIN
  FOR rec IN SELECT id, bucket_id, path FROM storage_files
    WHERE bucket_id = 'temp-uploads' AND created_at < now() - (max_age_hours || ' hours')::INTERVAL
  LOOP
    DELETE FROM storage_files WHERE id = rec.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.storage_create_bucket_policy(p_bucket TEXT, p_public BOOLEAN)
RETURNS VOID AS $$ BEGIN PERFORM 1; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE VIEW public.storage_stats AS
SELECT bucket_id, COUNT(*) as file_count, COALESCE(SUM(size), 0) as total_size, COUNT(DISTINCT owner_id) as unique_owners
FROM storage_files WHERE deleted_at IS NULL GROUP BY bucket_id;
