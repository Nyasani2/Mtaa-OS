
-- ============================================================
-- MTAA EDUCATION — PHASE A4: QR GENERATOR + SCANNER
-- Run this in Supabase SQL Editor before testing screens
-- ============================================================

-- education_qr_sessions: Track QR generation and scan events
CREATE TABLE IF NOT EXISTS public.education_qr_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- QR metadata
  qr_type text NOT NULL CHECK (qr_type = ANY (ARRAY[
    'student_id'::text,
    'teacher_id'::text,
    'attendance'::text,
    'transport_boarding'::text,
    'transport_alighting'::text,
    'entry_gate'::text,
    'exit_gate'::text,
    'certificate'::text,
    'event_checkin'::text,
    'library_access'::text,
    'lab_access'::text,
    'dorm_access'::text,
    'general'::text
  ])),
  qr_data text NOT NULL, -- The actual JSON payload
  qr_image_url text,

  -- Who generated it
  generated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_by_role text NOT NULL CHECK (generated_by_role = ANY (ARRAY['student'::text, 'teacher'::text, 'parent'::text, 'admin'::text, 'driver'::text, 'guard'::text])),

  -- For whom (if different from generator)
  target_id uuid, -- student_id, teacher_id, etc.
  target_type text CHECK (target_type = ANY (ARRAY['student'::text, 'teacher'::text, 'institution'::text, 'event'::text])),

  -- Context
  institution_id uuid REFERENCES public.education_institutions(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.education_classes(id) ON DELETE SET NULL,

  -- Validity
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  max_scans integer DEFAULT 1, -- 1 for single-use, NULL for unlimited
  scan_count integer DEFAULT 0,

  -- Status
  status text DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'expired'::text, 'revoked'::text, 'depleted'::text])),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- education_qr_scans: Log every scan event
CREATE TABLE IF NOT EXISTS public.education_qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.education_qr_sessions(id) ON DELETE CASCADE,

  -- Scanner info
  scanned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scanned_by_role text NOT NULL CHECK (scanned_by_role = ANY (ARRAY['teacher'::text, 'admin'::text, 'guard'::text, 'driver'::text, 'system'::text])),

  -- Scan context
  scan_method text DEFAULT 'camera' CHECK (scan_method = ANY (ARRAY['camera'::text, 'manual_entry'::text, 'nfc'::text, 'bluetooth'::text])),
  location jsonb DEFAULT '{}'::jsonb, -- {lat, lng, accuracy, timestamp}
  device_info jsonb DEFAULT '{}'::jsonb, -- {os, model, app_version}

  -- Result
  scan_result text NOT NULL CHECK (scan_result = ANY (ARRAY['success'::text, 'expired'::text, 'revoked'::text, 'invalid'::text, 'already_scanned'::text, 'wrong_institution'::text])),
  notes text,

  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_edu_qr_sessions_type ON public.education_qr_sessions(qr_type);
CREATE INDEX IF NOT EXISTS idx_edu_qr_sessions_generated_by ON public.education_qr_sessions(generated_by);
CREATE INDEX IF NOT EXISTS idx_edu_qr_sessions_target ON public.education_qr_sessions(target_id);
CREATE INDEX IF NOT EXISTS idx_edu_qr_sessions_status ON public.education_qr_sessions(status);
CREATE INDEX IF NOT EXISTS idx_edu_qr_sessions_valid ON public.education_qr_sessions(valid_until);
CREATE INDEX IF NOT EXISTS idx_edu_qr_scans_session ON public.education_qr_scans(session_id);
CREATE INDEX IF NOT EXISTS idx_edu_qr_scans_scanner ON public.education_qr_scans(scanned_by);
CREATE INDEX IF NOT EXISTS idx_edu_qr_scans_result ON public.education_qr_scans(scan_result);

-- RLS
ALTER TABLE public.education_qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QR sessions viewable by generator or target" ON public.education_qr_sessions
  FOR SELECT USING (
    generated_by = auth.uid()
    OR target_id IN (SELECT id FROM public.education_students WHERE user_id = auth.uid())
    OR target_id IN (SELECT id FROM public.education_teachers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.institution_id = institution_id AND t.user_id = auth.uid())
  );

CREATE POLICY "QR sessions manageable by generator" ON public.education_qr_sessions
  FOR ALL USING (generated_by = auth.uid());

CREATE POLICY "QR scans viewable by related" ON public.education_qr_scans
  FOR SELECT USING (
    scanned_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.education_qr_sessions s WHERE s.id = session_id AND s.generated_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.user_id = auth.uid())
  );

CREATE POLICY "QR scans insertable by scanner" ON public.education_qr_scans
  FOR INSERT WITH CHECK (scanned_by = auth.uid());

-- Trigger
DROP TRIGGER IF EXISTS trg_education_qr_sessions_updated_at ON public.education_qr_sessions;
CREATE TRIGGER trg_education_qr_sessions_updated_at BEFORE UPDATE ON public.education_qr_sessions FOR EACH ROW EXECUTE FUNCTION public.update_edu_updated_at();

-- Function: validate and record QR scan
CREATE OR REPLACE FUNCTION public.validate_qr_scan(
  p_session_id uuid,
  p_scanned_by uuid,
  p_scanned_by_role text,
  p_location jsonb DEFAULT '{}'::jsonb,
  p_device_info jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_session public.education_qr_sessions%ROWTYPE;
  v_result text;
BEGIN
  SELECT * INTO v_session FROM public.education_qr_sessions WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid');
  END IF;

  IF v_session.status = 'revoked' THEN
    v_result := 'revoked';
  ELSIF v_session.valid_until IS NOT NULL AND v_session.valid_until < now() THEN
    v_result := 'expired';
  ELSIF v_session.max_scans IS NOT NULL AND v_session.scan_count >= v_session.max_scans THEN
    v_result := 'already_scanned';
  ELSE
    v_result := 'success';
    -- Update scan count
    UPDATE public.education_qr_sessions 
    SET scan_count = scan_count + 1,
        status = CASE WHEN max_scans IS NOT NULL AND scan_count + 1 >= max_scans THEN 'depleted' ELSE status END,
        updated_at = now()
    WHERE id = p_session_id;
  END IF;

  -- Log scan
  INSERT INTO public.education_qr_scans (session_id, scanned_by, scanned_by_role, location, device_info, scan_result)
  VALUES (p_session_id, p_scanned_by, p_scanned_by_role, p_location, p_device_info, v_result);

  RETURN jsonb_build_object('valid', v_result = 'success', 'reason', v_result, 'session', row_to_json(v_session));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- EDGE FUNCTION: generate-education-qr
-- Deploy: supabase functions deploy generate-education-qr
-- ============================================================
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { QRCode } from 'https://esm.sh/qrcode@1.5.3'

serve(async (req) => {
  const { qr_type, target_id, target_type, institution_id, class_id, valid_minutes, max_scans, generated_by, generated_by_role } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const payload = JSON.stringify({
    type: qr_type,
    target_id,
    institution_id,
    class_id,
    timestamp: new Date().toISOString(),
    nonce: crypto.randomUUID(),
  })

  const qrDataUrl = await QRCode.toDataURL(payload, { width: 512, margin: 2, errorCorrectionLevel: 'H' })

  const validUntil = valid_minutes ? new Date(Date.now() + valid_minutes * 60000).toISOString() : null

  const { data, error } = await supabase
    .from('education_qr_sessions')
    .insert({
      qr_type,
      qr_data: payload,
      qr_image_url: qrDataUrl,
      generated_by,
      generated_by_role,
      target_id,
      target_type,
      institution_id,
      class_id,
      valid_until: validUntil,
      max_scans: max_scans || 1,
    })
    .select()
    .single()

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ data }), { status: 200 })
})
*/

-- ============================================================
-- EDGE FUNCTION: scan-education-qr
-- Deploy: supabase functions deploy scan-education-qr
-- ============================================================
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { session_id, scanned_by, scanned_by_role, location, device_info } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data, error } = await supabase.rpc('validate_qr_scan', {
    p_session_id: session_id,
    p_scanned_by: scanned_by,
    p_scanned_by_role: scanned_by_role,
    p_location: location || {},
    p_device_info: device_info || {}
  })

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ data }), { status: 200 })
})
*/
