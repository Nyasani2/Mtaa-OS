-- ============================================================
-- MTAA Device Platform — Storage RLS + Helper Functions
-- ============================================================
BEGIN;

-- Helper: increment evidence download counter
CREATE OR REPLACE FUNCTION increment_evidence_download(evidence_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE evidence
  SET download_count = download_count + 1
  WHERE id = evidence_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all device platform tables
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'devices', 'device_assignments', 'recordings', 'evidence', 'incidents',
    'bodycam_sessions', 'shift_assignments', 'driver_scores', 'device_logs',
    'firmware_versions', 'obd_diagnostics', 'repair_records', 'fleet_alerts'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl, tbl);
  END LOOP;
END $$;

-- STORAGE BUCKET POLICIES
-- Note: Create these buckets in Supabase Dashboard first:
-- recordings, thumbnails, evidence, device-firmware, incident-photos

-- recordings bucket policies
DROP POLICY IF EXISTS "recordings_insert_driver" ON storage.objects;
CREATE POLICY "recordings_insert_driver" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recordings'
    AND auth.uid() IN (SELECT assigned_user_id FROM device_assignments)
  );

DROP POLICY IF EXISTS "recordings_select_driver" ON storage.objects;
CREATE POLICY "recordings_select_driver" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'recordings'
    AND auth.uid() IN (SELECT assigned_user_id FROM device_assignments)
  );

DROP POLICY IF EXISTS "recordings_delete_driver" ON storage.objects;
CREATE POLICY "recordings_delete_driver" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recordings'
    AND auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
  );

-- thumbnails bucket policies
DROP POLICY IF EXISTS "thumbnails_insert_driver" ON storage.objects;
CREATE POLICY "thumbnails_insert_driver" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.uid() IN (SELECT assigned_user_id FROM device_assignments)
  );

DROP POLICY IF EXISTS "thumbnails_select_all" ON storage.objects;
CREATE POLICY "thumbnails_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

-- evidence bucket policies
DROP POLICY IF EXISTS "evidence_insert_authorized" ON storage.objects;
CREATE POLICY "evidence_insert_authorized" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence'
    AND auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'police_officer', 'fleet_manager', 'mechanic'))
  );

DROP POLICY IF EXISTS "evidence_select_authorized" ON storage.objects;
CREATE POLICY "evidence_select_authorized" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence'
    AND (
      auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'police_officer', 'fleet_manager', 'mechanic', 'insurance_agent'))
      OR EXISTS (SELECT 1 FROM evidence WHERE share_token IS NOT NULL)
    )
  );

-- device-firmware bucket policies
DROP POLICY IF EXISTS "firmware_admin_only" ON storage.objects;
CREATE POLICY "firmware_admin_only" ON storage.objects
  FOR ALL USING (
    bucket_id = 'device-firmware'
    AND auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager'))
  );

-- incident-photos bucket policies
DROP POLICY IF EXISTS "incident_photos_insert" ON storage.objects;
CREATE POLICY "incident_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'incident-photos'
    AND auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'police_officer', 'mechanic', 'ambulance_dispatcher'))
  );

DROP POLICY IF EXISTS "incident_photos_select" ON storage.objects;
CREATE POLICY "incident_photos_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'incident-photos'
    AND auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'fleet_manager', 'police_officer', 'mechanic', 'insurance_agent', 'ambulance_dispatcher'))
  );

COMMIT;
