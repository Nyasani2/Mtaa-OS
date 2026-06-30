-- REPUTATION TABLES
CREATE TABLE IF NOT EXISTS public.profile_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text,'verified'::text,'rejected'::text])),
  verified_at timestamp with time zone,
  method text,
  document_url text,
  notes text,
  verified_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_verifications_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_profile_verifications_user ON public.profile_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_verifications_status ON public.profile_verifications(status);
ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profile_verifications_select_own ON public.profile_verifications;
CREATE POLICY profile_verifications_select_own ON public.profile_verifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS profile_verifications_admin_all ON public.profile_verifications;
CREATE POLICY profile_verifications_admin_all ON public.profile_verifications FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS public.profile_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id),
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'low' CHECK (severity = ANY (ARRAY['low'::text,'medium'::text,'high'::text,'critical'::text])),
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text,'under_review'::text,'resolved'::text,'dismissed'::text])),
  issued_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES auth.users(id),
  appeal_status text CHECK (appeal_status = ANY (ARRAY['pending'::text,'approved'::text,'rejected'::text])),
  appeal_reason text,
  appeal_submitted_at timestamp with time zone,
  CONSTRAINT profile_reports_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_profile_reports_reported ON public.profile_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_reports_status ON public.profile_reports(status);
ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profile_reports_select_own ON public.profile_reports;
CREATE POLICY profile_reports_select_own ON public.profile_reports FOR SELECT USING (auth.uid() = reported_user_id OR auth.uid() = reporter_id);
DROP POLICY IF EXISTS profile_reports_admin_all ON public.profile_reports;
CREATE POLICY profile_reports_admin_all ON public.profile_reports FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
