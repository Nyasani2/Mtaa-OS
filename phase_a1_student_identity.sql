
-- ============================================================
-- MTAA EDUCATION — PHASE A1: STUDENT IDENTITY
-- Run this in Supabase SQL Editor before testing screens
-- ============================================================

-- education_student_identities: Extended student profile + QR identity card
CREATE TABLE IF NOT EXISTS public.education_student_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.education_students(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  -- Identity Card
  card_number text UNIQUE NOT NULL,
  qr_code_data text NOT NULL, -- JSON stringified: {student_id, institution_id, timestamp, signature}
  qr_code_url text, -- Generated QR image URL
  card_issued_at timestamptz DEFAULT now(),
  card_expires_at timestamptz,
  card_status text DEFAULT 'active' CHECK (card_status = ANY (ARRAY['active'::text, 'suspended'::text, 'revoked'::text, 'expired'::text])),

  -- Guardian Links (normalized from students table)
  primary_guardian_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  primary_guardian_name text,
  primary_guardian_phone text,
  primary_guardian_relationship text DEFAULT 'parent' CHECK (primary_guardian_relationship = ANY (ARRAY['parent'::text, 'grandparent'::text, 'sibling'::text, 'uncle'::text, 'aunt'::text, 'guardian'::text, 'other'::text])),

  secondary_guardian_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  secondary_guardian_name text,
  secondary_guardian_phone text,
  secondary_guardian_relationship text,

  -- Emergency
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  medical_conditions jsonb DEFAULT '[]'::jsonb, -- [{condition, severity, notes}]
  blood_group text,
  allergies jsonb DEFAULT '[]'::jsonb,

  -- Academic History (snapshot per term)
  academic_history jsonb DEFAULT '[]'::jsonb, -- [{term, class, average, rank, remarks}]
  achievements jsonb DEFAULT '[]'::jsonb, -- [{title, date, category, description}]
  discipline_records jsonb DEFAULT '[]'::jsonb, -- [{date, incident, action, status}]
  skills jsonb DEFAULT '[]'::jsonb, -- [{skill, level, verified}]
  portfolio jsonb DEFAULT '[]'::jsonb, -- [{title, type, url, description, date}]

  -- Transport & Safety
  transport_route_id uuid,
  transport_stop text,
  safety_status text DEFAULT 'safe' CHECK (safety_status = ANY (ARRAY['safe'::text, 'alert'::text, 'missing'::text, 'emergency'::text])),
  last_location jsonb DEFAULT '{}'::jsonb, -- {lat, lng, timestamp, source}
  entry_exit_logs jsonb DEFAULT '[]'::jsonb, -- [{gate, direction, timestamp, method}]

  -- Certificates
  certificates jsonb DEFAULT '[]'::jsonb, -- [{id, title, issuer, date, qr_url, verified}]

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (student_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_edu_student_identities_student ON public.education_student_identities(student_id);
CREATE INDEX IF NOT EXISTS idx_edu_student_identities_card ON public.education_student_identities(card_number);
CREATE INDEX IF NOT EXISTS idx_edu_student_identities_guardian ON public.education_student_identities(primary_guardian_id);
CREATE INDEX IF NOT EXISTS idx_edu_student_identities_safety ON public.education_student_identities(safety_status);

-- RLS
ALTER TABLE public.education_student_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student identities viewable by related" ON public.education_student_identities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.education_students s WHERE s.id = student_id AND s.user_id = auth.uid())
    OR primary_guardian_id = auth.uid()
    OR secondary_guardian_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.institution_id = education_student_identities.institution_id AND t.user_id = auth.uid() AND t.is_active = true)
    OR EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid())
  );

CREATE POLICY "Student identities manageable by admin" ON public.education_student_identities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.institution_id = institution_id AND t.user_id = auth.uid() AND t.is_active = true)
  );

-- Trigger
DROP TRIGGER IF EXISTS trg_education_student_identities_updated_at ON public.education_student_identities;
CREATE TRIGGER trg_education_student_identities_updated_at BEFORE UPDATE ON public.education_student_identities FOR EACH ROW EXECUTE FUNCTION public.update_edu_updated_at();

-- ============================================================
-- EDGE FUNCTION: generate-student-qr
-- Deploy: supabase functions deploy generate-student-qr
-- ============================================================
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { QRCode } from 'https://esm.sh/qrcode@1.5.3'

serve(async (req) => {
  const { student_id, institution_id } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const payload = JSON.stringify({
    student_id,
    institution_id,
    timestamp: new Date().toISOString(),
    signature: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${student_id}:${institution_id}:${Date.now()}`))
  })

  const qrDataUrl = await QRCode.toDataURL(payload, { width: 512, margin: 2 })

  const { data, error } = await supabase
    .from('education_student_identities')
    .upsert({ student_id, institution_id, qr_code_data: payload, qr_code_url: qrDataUrl }, { onConflict: 'student_id' })
    .select()
    .single()

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ data }), { status: 200 })
})
*/
