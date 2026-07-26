
-- ============================================
-- APP STORE SUBMISSIONS SYSTEM
-- Developer Portal backend
-- ============================================

-- 1. app_submissions table
CREATE TABLE IF NOT EXISTS app_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'pending_review' 
    CHECK (status IN ('pending_review', 'reviewing', 'approved', 'rejected', 'published')),
  fee_paid NUMERIC(10,2) NOT NULL DEFAULT 15.00,
  review_notes TEXT,
  ai_score NUMERIC(3,2),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE app_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can view own submissions"
  ON app_submissions FOR SELECT
  USING (auth.uid() = developer_id);

CREATE POLICY "Developers can create submissions"
  ON app_submissions FOR INSERT
  WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Admins can view all submissions"
  ON app_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update submissions"
  ON app_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- 2. deduct_balance RPC function
CREATE OR REPLACE FUNCTION deduct_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  -- Get current balance
  SELECT balance INTO v_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check sufficient balance
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct balance
  UPDATE wallets
  SET 
    balance = balance - p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    description,
    status
  ) VALUES (
    p_user_id,
    'debit',
    p_amount,
    'USD',
    'App Store submission fee',
    'completed'
  );

  RETURN TRUE;
END;
$$;

-- 3. ai_review_app RPC (simulated AI review)
CREATE OR REPLACE FUNCTION ai_review_app(
  p_submission_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission RECORD;
  v_score NUMERIC := 0;
  v_checks JSONB := '[]'::JSONB;
  v_status TEXT := 'rejected';
  v_notes TEXT := '';
BEGIN
  -- Get submission
  SELECT * INTO v_submission
  FROM app_submissions
  WHERE id = p_submission_id;

  IF v_submission IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Submission not found'
    );
  END IF;

  -- AI Checks
  -- Check 1: Name length
  IF length(v_submission.app_name) >= 3 THEN
    v_score := v_score + 20;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Name length', 'passed', true, 'score', 20));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Name length', 'passed', false, 'score', 0, 'reason', 'Name too short'));
    v_notes := v_notes || '❌ Name too short (min 3 chars)
';
  END IF;

  -- Check 2: Description length
  IF length(v_submission.description) >= 20 THEN
    v_score := v_score + 25;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Description length', 'passed', true, 'score', 25));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Description length', 'passed', false, 'score', 0, 'reason', 'Description too short'));
    v_notes := v_notes || '❌ Description too short (min 20 chars)
';
  END IF;

  -- Check 3: No prohibited terms
  IF v_submission.description !~* '(spam|scam|fraud|hack|crack|pirate)' THEN
    v_score := v_score + 25;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Policy compliance', 'passed', true, 'score', 25));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Policy compliance', 'passed', false, 'score', 0, 'reason', 'Contains prohibited terms'));
    v_notes := v_notes || '❌ Contains prohibited terms (spam, scam, fraud, hack, crack, pirate)
';
  END IF;

  -- Check 4: Valid category
  IF v_submission.category = ANY(ARRAY[
    'transport', 'health', 'finance', 'commerce', 'social',
    'work', 'education', 'government', 'productivity', 'media',
    'communication', 'utility', 'business', 'entertainment'
  ]) THEN
    v_score := v_score + 15;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Valid category', 'passed', true, 'score', 15));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Valid category', 'passed', false, 'score', 0, 'reason', 'Invalid category'));
    v_notes := v_notes || '❌ Invalid category
';
  END IF;

  -- Check 5: Version format
  IF v_submission.version ~ '^\d+\.\d+\.\d+$' THEN
    v_score := v_score + 15;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Version format', 'passed', true, 'score', 15));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('check', 'Version format', 'passed', false, 'score', 0, 'reason', 'Invalid version format'));
    v_notes := v_notes || '❌ Invalid version format (use x.x.x)
';
  END IF;

  -- Determine status (pass if score >= 70)
  IF v_score >= 70 THEN
    v_status := 'approved';
    v_notes := '✅ All checks passed
' || v_notes || E'\nAI Score: ' || v_score || '/100
Your app has been approved for the AppStore.';

    -- Auto-publish to app_store_apps
    INSERT INTO app_store_apps (
      name, description, category, version, 
      developer_id, status, submission_id
    ) VALUES (
      v_submission.app_name,
      v_submission.description,
      v_submission.category,
      v_submission.version,
      v_submission.developer_id,
      'published',
      v_submission.id
    );
  ELSE
    v_notes := '❌ App rejected
' || v_notes || E'\nAI Score: ' || v_score || '/100 (min 70 required)
Please fix issues and resubmit ($15 fee applies).';
  END IF;

  -- Update submission
  UPDATE app_submissions
  SET 
    status = v_status,
    review_notes = v_notes,
    ai_score = v_score,
    reviewed_at = now(),
    published_at = CASE WHEN v_status = 'approved' THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_submission_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', v_status,
    'score', v_score,
    'checks', v_checks,
    'notes', v_notes
  );
END;
$$;

-- 4. Add developer role to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT FALSE;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION deduct_balance(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION ai_review_app(UUID) TO authenticated;
