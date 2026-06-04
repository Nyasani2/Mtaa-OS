-- Tribes and Membership Schema — SAFE VERSION (skips existing objects)

-- tribes
CREATE TABLE IF NOT EXISTS public.tribes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  slug          VARCHAR(200) NOT NULL UNIQUE,
  description   TEXT,
  avatar_url    TEXT,
  cover_url     TEXT,
  category      VARCHAR(100),
  is_private    BOOLEAN NOT NULL DEFAULT false,
  member_count  INTEGER NOT NULL DEFAULT 0,
  post_count    INTEGER NOT NULL DEFAULT 0,
  creator_id    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe indexes (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tribes_category'
  ) THEN
    CREATE INDEX idx_tribes_category ON public.tribes(category);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tribes_slug'
  ) THEN
    CREATE INDEX idx_tribes_slug ON public.tribes(slug);
  END IF;
END $$;

ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public tribes" ON public.tribes;
CREATE POLICY "Anyone can view public tribes"
  ON public.tribes FOR SELECT
  USING (NOT is_private OR auth.uid() = creator_id);

-- tribe_members
CREATE TABLE IF NOT EXISTS public.tribe_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tribe_id  UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tribe_id, user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tribe_members_tribe_id'
  ) THEN
    CREATE INDEX idx_tribe_members_tribe_id ON public.tribe_members(tribe_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tribe_members_user_id'
  ) THEN
    CREATE INDEX idx_tribe_members_user_id ON public.tribe_members(user_id);
  END IF;
END $$;

ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tribe members" ON public.tribe_members;
DROP POLICY IF EXISTS "Users can join/leave tribes" ON public.tribe_members;

CREATE POLICY "Users can view tribe members"
  ON public.tribe_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join/leave tribes"
  ON public.tribe_members FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- tribe_posts
CREATE TABLE IF NOT EXISTS public.tribe_posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tribe_id        UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES auth.users(id),
  title           VARCHAR(500),
  content         TEXT NOT NULL,
  media_urls      TEXT[] DEFAULT '{}',
  likes_count     INTEGER NOT NULL DEFAULT 0,
  comments_count  INTEGER NOT NULL DEFAULT 0,
  is_pinned       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tribe_posts_tribe_id'
  ) THEN
    CREATE INDEX idx_tribe_posts_tribe_id ON public.tribe_posts(tribe_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tribe_posts_author_id'
  ) THEN
    CREATE INDEX idx_tribe_posts_author_id ON public.tribe_posts(author_id);
  END IF;
END $$;

ALTER TABLE public.tribe_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tribe posts" ON public.tribe_posts;
DROP POLICY IF EXISTS "Members can create posts" ON public.tribe_posts;

CREATE POLICY "Anyone can view tribe posts"
  ON public.tribe_posts FOR SELECT
  USING (true);

CREATE POLICY "Members can create posts"
  ON public.tribe_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- tribe_join_requests
CREATE TABLE IF NOT EXISTS public.tribe_join_requests (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tribe_id  UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message   TEXT,
  status    VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tribe_id, user_id)
);

ALTER TABLE public.tribe_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage join requests" ON public.tribe_join_requests;
CREATE POLICY "Admins can manage join requests"
  ON public.tribe_join_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribe_join_requests.tribe_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'tribe%'
ORDER BY table_name;
