
-- ============================================================
-- MTAA EDUCATION — PHASE A2: TEACHER IDENTITY
-- Run this in Supabase SQL Editor before testing screens
-- ============================================================

-- education_teacher_identities: Extended teacher profile + identity card
CREATE TABLE IF NOT EXISTS public.education_teacher_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.education_teachers(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  -- Identity Card
  card_number text UNIQUE NOT NULL,
  qr_code_data text NOT NULL,
  qr_code_url text,
  card_issued_at timestamptz DEFAULT now(),
  card_expires_at timestamptz,
  card_status text DEFAULT 'active' CHECK (card_status = ANY (ARRAY['active'::text, 'suspended'::text, 'revoked'::text, 'expired'::text])),

  -- Professional Identity
  professional_bio text,
  teaching_philosophy text,
  research_interests jsonb DEFAULT '[]'::jsonb,
  publications jsonb DEFAULT '[]'::jsonb, -- [{title, journal, year, url}]
  conferences jsonb DEFAULT '[]'::jsonb, -- [{name, year, role, location}]
  awards jsonb DEFAULT '[]'::jsonb, -- [{title, issuer, year, description}]
  professional_memberships jsonb DEFAULT '[]'::jsonb, -- [{organization, membership_id, since}]

  -- Content & Economy
  content_count integer DEFAULT 0,
  total_students_taught integer DEFAULT 0,
  total_lessons_delivered integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  revenue_earned numeric DEFAULT 0,
  wallet_balance numeric DEFAULT 0,

  -- Performance Metrics
  attendance_rate numeric DEFAULT 0,
  punctuality_rate numeric DEFAULT 0,
  student_progress_rate numeric DEFAULT 0,
  parent_satisfaction_rate numeric DEFAULT 0,
  peer_review_score numeric DEFAULT 0,

  -- Safety & Access
  biometric_enrolled boolean DEFAULT false,
  biometric_template_id text,
  access_level text DEFAULT 'teacher' CHECK (access_level = ANY (ARRAY['teacher'::text, 'senior_teacher'::text, 'hod'::text, 'deputy'::text, 'principal'::text])),
  building_access jsonb DEFAULT '[]'::jsonb, -- [{building_id, access_hours}]
  last_check_in timestamptz,
  last_check_out timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (teacher_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_edu_teacher_identities_teacher ON public.education_teacher_identities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_edu_teacher_identities_card ON public.education_teacher_identities(card_number);
CREATE INDEX IF NOT EXISTS idx_edu_teacher_identities_institution ON public.education_teacher_identities(institution_id);
CREATE INDEX IF NOT EXISTS idx_edu_teacher_identities_access ON public.education_teacher_identities(access_level);

-- RLS
ALTER TABLE public.education_teacher_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher identities viewable by related" ON public.education_teacher_identities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_students s WHERE s.institution_id = institution_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_teachers t2 WHERE t2.institution_id = institution_id AND t2.user_id = auth.uid() AND t2.is_active = true)
  );

CREATE POLICY "Teacher identities manageable by self/admin" ON public.education_teacher_identities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid())
  );

-- Trigger
DROP TRIGGER IF EXISTS trg_education_teacher_identities_updated_at ON public.education_teacher_identities;
CREATE TRIGGER trg_education_teacher_identities_updated_at BEFORE UPDATE ON public.education_teacher_identities FOR EACH ROW EXECUTE FUNCTION public.update_edu_updated_at();

-- ============================================================
-- EDGE FUNCTION: generate-teacher-qr
-- Deploy: supabase functions deploy generate-teacher-qr
-- ============================================================
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { QRCode } from 'https://esm.sh/qrcode@1.5.3'

serve(async (req) => {
  const { teacher_id, institution_id } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const payload = JSON.stringify({
    teacher_id,
    institution_id,
    type: 'teacher',
    timestamp: new Date().toISOString(),
    signature: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${teacher_id}:${institution_id}:${Date.now()}`))
  })

  const qrDataUrl = await QRCode.toDataURL(payload, { width: 512, margin: 2 })

  const { data, error } = await supabase
    .from('education_teacher_identities')
    .upsert({ teacher_id, institution_id, qr_code_data: payload, qr_code_url: qrDataUrl }, { onConflict: 'teacher_id' })
    .select()
    .single()

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ data }), { status: 200 })
})
*/
