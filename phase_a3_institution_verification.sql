
-- ============================================================
-- MTAA EDUCATION — PHASE A3: INSTITUTION IDENTITY + VERIFICATION
-- Run this in Supabase SQL Editor before testing screens
-- ============================================================

-- education_institution_profiles: Extended institution data
CREATE TABLE IF NOT EXISTS public.education_institution_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  -- Detailed Info
  motto text,
  vision text,
  mission text,
  about text,
  history text,
  founding_year integer,
  founder_name text,

  -- Facilities
  facilities jsonb DEFAULT '[]'::jsonb, -- [{name, type, capacity, condition}]
  labs jsonb DEFAULT '[]'::jsonb, -- [{subject, equipment_count, status}]
  library_books integer DEFAULT 0,
  computer_count integer DEFAULT 0,
  internet_available boolean DEFAULT false,
  electricity_source text DEFAULT 'grid', -- grid, solar, generator, none
  water_source text DEFAULT 'piped', -- piped, borehole, rain, none

  -- Staffing
  total_teachers integer DEFAULT 0,
  total_support_staff integer DEFAULT 0,
  teacher_student_ratio text,
  vacancies jsonb DEFAULT '[]'::jsonb, -- [{position, subject, deadline}]

  -- Performance
  national_ranking integer,
  county_ranking integer,
  mean_score_last_exam numeric,
  pass_rate numeric DEFAULT 0,
  transition_rate numeric DEFAULT 0, -- to next level

  -- Safety
  has_perimeter_wall boolean DEFAULT false,
  has_security_guard boolean DEFAULT false,
  has_cctv boolean DEFAULT false,
  has_fire_extinguisher boolean DEFAULT false,
  has_first_aid_kit boolean DEFAULT false,
  emergency_exits integer DEFAULT 0,
  assembly_point text,

  -- Governance
  board_members jsonb DEFAULT '[]'::jsonb, -- [{name, role, phone, since}]
  pta_active boolean DEFAULT false,
  pta_chair_name text,
  pta_chair_phone text,

  -- Fees
  fee_structure jsonb DEFAULT '[]'::jsonb, -- [{level, amount, breakdown}]
  accepts_bursaries boolean DEFAULT false,
  accepts_scholarships boolean DEFAULT false,
  payment_methods jsonb DEFAULT '[]'::jsonb, -- [mpesa, bank, wallet]

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (institution_id)
);

-- education_verification_logs: Ministry approval audit trail
CREATE TABLE IF NOT EXISTS public.education_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  -- Verification Step
  step text NOT NULL CHECK (step = ANY (ARRAY[
    'registration_submitted'::text,
    'documents_received'::text,
    'site_inspection_scheduled'::text,
    'site_inspection_completed'::text,
    'ministry_review'::text,
    'approved'::text,
    'rejected'::text,
    'appealed'::text,
    're_inspection'::text
  ])),
  step_number integer NOT NULL, -- 1, 2, 3...
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'failed'::text])),

  -- Actor
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text CHECK (actor_role = ANY (ARRAY['school_admin'::text, 'it_teacher'::text, 'ministry_officer'::text, 'inspector'::text, 'system'::text])),
  actor_name text,

  -- Details
  notes text,
  documents_required jsonb DEFAULT '[]'::jsonb,
  documents_submitted jsonb DEFAULT '[]'::jsonb,
  inspection_report jsonb DEFAULT '{}'::jsonb,
  rejection_reason text,

  -- Timeline
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  due_date timestamptz,

  created_at timestamptz DEFAULT now()
);

-- education_institution_documents: Uploaded verification docs
CREATE TABLE IF NOT EXISTS public.education_institution_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  document_type text NOT NULL CHECK (document_type = ANY (ARRAY[
    'registration_certificate'::text,
    'kra_pin'::text,
    'land_title'::text,
    'building_plan'::text,
    'fire_safety_cert'::text,
    'health_cert'::text,
    'teacher_licenses'::text,
    'insurance'::text,
    'bank_statement'::text,
    'ministry_letter'::text,
    'other'::text
  ])),
  document_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,

  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  verification_status text DEFAULT 'pending' CHECK (verification_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  rejection_reason text,

  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_edu_inst_profiles_institution ON public.education_institution_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_edu_verification_logs_institution ON public.education_verification_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_edu_verification_logs_step ON public.education_verification_logs(step);
CREATE INDEX IF NOT EXISTS idx_edu_inst_docs_institution ON public.education_institution_documents(institution_id);
CREATE INDEX IF NOT EXISTS idx_edu_inst_docs_type ON public.education_institution_documents(document_type);

-- RLS
ALTER TABLE public.education_institution_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_institution_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution profiles viewable by all" ON public.education_institution_profiles
  FOR SELECT USING (true);
CREATE POLICY "Institution profiles manageable by admin" ON public.education_institution_profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid()));

CREATE POLICY "Verification logs viewable by related" ON public.education_verification_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid())
    OR actor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.institution_id = institution_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Verification logs manageable by admin" ON public.education_verification_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid()));

CREATE POLICY "Institution docs viewable by related" ON public.education_institution_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.institution_id = institution_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Institution docs manageable by admin" ON public.education_institution_documents
  FOR ALL USING (EXISTS (SELECT 1 FROM public.education_institutions i WHERE i.id = institution_id AND i.head_teacher_id = auth.uid()));

-- Triggers
DROP TRIGGER IF EXISTS trg_education_institution_profiles_updated_at ON public.education_institution_profiles;
CREATE TRIGGER trg_education_institution_profiles_updated_at BEFORE UPDATE ON public.education_institution_profiles FOR EACH ROW EXECUTE FUNCTION public.update_edu_updated_at();

-- ============================================================
-- EDGE FUNCTION: submit-institution-verification
-- Deploy: supabase functions deploy submit-institution-verification
-- ============================================================
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { institution_id, step, actor_id, notes, documents } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data, error } = await supabase
    .from('education_verification_logs')
    .insert({ institution_id, step, actor_id, notes, documents_submitted: documents })
    .select()
    .single()

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

  // Update institution status
  await supabase.from('education_institutions')
    .update({ verification_status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', institution_id)

  return new Response(JSON.stringify({ data }), { status: 200 })
})
*/
