-- ============================================================
-- STREETS ENHANCED FEATURES
-- Dislikes, Collabs, Duets, Reports, Not Interested
-- ============================================================

-- ─── streets_dislikes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streets_dislikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.streets_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.streets_dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "streets_dislikes_select_own" ON public.streets_dislikes;
DROP POLICY IF EXISTS "streets_dislikes_insert_own" ON public.streets_dislikes;
DROP POLICY IF EXISTS "streets_dislikes_delete_own" ON public.streets_dislikes;

CREATE POLICY "streets_dislikes_select_own"
  ON public.streets_dislikes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "streets_dislikes_insert_own"
  ON public.streets_dislikes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streets_dislikes_delete_own"
  ON public.streets_dislikes FOR DELETE
  USING (auth.uid() = user_id);

-- ─── streets_collabs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streets_collabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.streets_posts(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.streets_collabs ENABLE ROW LEVEL SECURITY;

-- ─── streets_duets ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streets_duets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id uuid NOT NULL REFERENCES public.streets_posts(id) ON DELETE CASCADE,
  duet_post_id uuid NOT NULL REFERENCES public.streets_posts(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.streets_duets ENABLE ROW LEVEL SECURITY;

-- ─── streets_reports ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streets_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.streets_posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.streets_reports ENABLE ROW LEVEL SECURITY;

-- ─── streets_not_interested ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.streets_not_interested (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.streets_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.streets_not_interested ENABLE ROW LEVEL SECURITY;

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_streets_dislikes_post ON public.streets_dislikes(post_id);
CREATE INDEX IF NOT EXISTS idx_streets_dislikes_user ON public.streets_dislikes(user_id);
CREATE INDEX IF NOT EXISTS idx_streets_collabs_post ON public.streets_collabs(post_id);
CREATE INDEX IF NOT EXISTS idx_streets_duets_original ON public.streets_duets(original_post_id);
CREATE INDEX IF NOT EXISTS idx_streets_reports_post ON public.streets_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_streets_not_interested_user ON public.streets_not_interested(user_id);

-- ─── Add counts to streets_posts ──────────────────────────
ALTER TABLE public.streets_posts ADD COLUMN IF NOT EXISTS dislikes_count int DEFAULT 0;
ALTER TABLE public.streets_posts ADD COLUMN IF NOT EXISTS collabs_count int DEFAULT 0;
ALTER TABLE public.streets_posts ADD COLUMN IF NOT EXISTS duets_count int DEFAULT 0;
