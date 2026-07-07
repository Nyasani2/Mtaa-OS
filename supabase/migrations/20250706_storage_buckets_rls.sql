-- ============================================================
-- MTAA Device Platform — Storage Buckets & RLS
-- Batch 6: Storage infrastructure
-- ============================================================

-- Create buckets (run in Supabase Dashboard or via SQL)
-- Note: Buckets are typically created via API, but we document the setup here

/*
Use Supabase Dashboard > Storage > New Bucket:
1. recordings — Private
2. thumbnails — Private  
3. evidence — Private
4. device-firmware — Private
5. incident-photos — Private
*/

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Recordings bucket: drivers can upload their own, admins can read all
CREATE POLICY IF NOT EXISTS "recordings_insert_driver"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "recordings_select_driver"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'fleet_manager', 'police_officer')
    )
  )
);

CREATE POLICY IF NOT EXISTS "recordings_delete_driver"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Thumbnails bucket: same pattern as recordings
CREATE POLICY IF NOT EXISTS "thumbnails_insert_driver"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "thumbnails_select_all"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'thumbnails');

-- Evidence bucket: restricted access, police/admin only for sensitive
CREATE POLICY IF NOT EXISTS "evidence_insert_authorized"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'fleet_manager', 'police_officer', 'mechanic')
  )
);

CREATE POLICY IF NOT EXISTS "evidence_select_authorized"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'fleet_manager', 'police_officer', 'mechanic')
    )
  )
);

-- Device firmware bucket: admin only
CREATE POLICY IF NOT EXISTS "firmware_admin_only"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'device-firmware' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Incident photos bucket: participants and authorized roles
CREATE POLICY IF NOT EXISTS "incident_photos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'incident-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "incident_photos_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'incident-photos' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'fleet_manager', 'police_officer')
    )
  )
);

-- ============================================
-- HELPER FUNCTION: increment evidence download
-- ============================================
CREATE OR REPLACE FUNCTION increment_evidence_download(evidence_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE evidence
  SET download_count = download_count + 1,
      updated_at = NOW()
  WHERE id = evidence_id;
END;
$$;

-- ============================================
-- TRIGGER: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all device platform tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('devices', 'device_assignments', 'recordings', 'evidence', 'incidents')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
      CREATE TRIGGER trg_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;
