-- ============================================
-- A3 KYC UPGRADE — SQL CHUNK
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create kyc_submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    level_requested INTEGER NOT NULL DEFAULT 1,
    id_front_url TEXT,
    id_back_url TEXT,
    selfie_url TEXT,
    address_proof_url TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Enable RLS
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own KYC submissions" ON kyc_submissions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft submissions" ON kyc_submissions
    FOR UPDATE USING (user_id = auth.uid() AND status = 'draft');

-- Admin can view all (for review portal)
CREATE POLICY "Admins can view all KYC" ON kyc_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'compliance_officer')
        )
    );

CREATE POLICY "Admins can update KYC status" ON kyc_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'compliance_officer')
        )
    );

-- 4. Function: Auto-update profile.kyc_level on approval
CREATE OR REPLACE FUNCTION handle_kyc_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Update profile KYC level
        UPDATE profiles 
        SET kyc_level = NEW.level_requested,
            kyc_verified_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.user_id;

        -- Create audit log
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
        VALUES (
            gen_random_uuid(),
            NEW.user_id,
            'kyc_approved',
            'kyc_submission',
            NEW.id,
            jsonb_build_object(
                'level', NEW.level_requested,
                'reviewed_by', NEW.reviewed_by
            ),
            NOW()
        );
    END IF;

    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
        VALUES (
            gen_random_uuid(),
            NEW.user_id,
            'kyc_rejected',
            'kyc_submission',
            NEW.id,
            jsonb_build_object(
                'level', NEW.level_requested,
                'reason', NEW.rejection_reason,
                'reviewed_by', NEW.reviewed_by
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 5. Trigger on kyc_submissions
DROP TRIGGER IF EXISTS kyc_approval_trigger ON kyc_submissions;
CREATE TRIGGER kyc_approval_trigger
    AFTER UPDATE ON kyc_submissions
    FOR EACH ROW
    EXECUTE FUNCTION handle_kyc_approval();

-- 6. Create storage bucket for KYC documents if not exists
-- (Run in Storage section of Supabase Dashboard, or use SQL if extension available)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('documents', 'documents', false) 
-- ON CONFLICT DO NOTHING;

-- 7. Storage policies for KYC documents
-- Users can upload to their own folder
CREATE POLICY "Users can upload own KYC docs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can read their own docs
CREATE POLICY "Users can read own KYC docs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Admins can read all docs
CREATE POLICY "Admins can read all KYC docs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'compliance_officer')
        )
    );

-- 8. Edge function helper: kyc-review (admin only)
-- Deployed separately as edge function

-- 9. Add kyc_level to profiles if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'kyc_level') THEN
        ALTER TABLE profiles ADD COLUMN kyc_level INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'kyc_verified_at') THEN
        ALTER TABLE profiles ADD COLUMN kyc_verified_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- 10. Index for performance
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
