-- DOCUMENTS TABLE — Profile Documents Vault
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['id'::text,'passport'::text,'license'::text,'certificate'::text,'contract'::text,'land'::text,'business'::text,'insurance'::text,'resume'::text,'portfolio'::text,'other'::text])),
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  verified_by uuid REFERENCES auth.users(id),
  uploaded_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expiry_date date,
  document_number text,
  issuing_authority text,
  notes text,
  is_public boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_verified ON public.documents(verified);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON public.documents(uploaded_at DESC);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_select_own ON public.documents;
CREATE POLICY documents_select_own ON public.documents FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS documents_insert_own ON public.documents;
CREATE POLICY documents_insert_own ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS documents_update_own ON public.documents;
CREATE POLICY documents_update_own ON public.documents FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS documents_delete_own ON public.documents;
CREATE POLICY documents_delete_own ON public.documents FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS documents_admin_all ON public.documents;
CREATE POLICY documents_admin_all ON public.documents FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS documents_storage_upload ON storage.objects;
CREATE POLICY documents_storage_upload ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS documents_storage_select ON storage.objects;
CREATE POLICY documents_storage_select ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS documents_storage_delete ON storage.objects;
CREATE POLICY documents_storage_delete ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE OR REPLACE FUNCTION update_documents_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_documents_updated_at();
