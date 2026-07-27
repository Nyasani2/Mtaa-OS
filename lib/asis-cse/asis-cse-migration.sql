-- ============================================================================
-- ASIS CSE v2 — Database Migration
-- Creates tables for session memory, message history, and long-term memories.
-- Run this in Supabase SQL Editor before deploying Batch 1 + 2.
-- ============================================================================

-- ============================================================================
-- 1. ASIS SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'ASIS Conversation',
    context_window INTEGER NOT NULL DEFAULT 20,
    last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.asis_sessions IS 'ASIS chat sessions per user';

-- Index for fast user session lookups
CREATE INDEX IF NOT EXISTS idx_asis_sessions_user_id ON public.asis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_asis_sessions_last_active ON public.asis_sessions(last_active DESC);

-- RLS
ALTER TABLE public.asis_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own ASIS sessions" ON public.asis_sessions;
CREATE POLICY "Users can CRUD own ASIS sessions"
    ON public.asis_sessions
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 2. ASIS MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asis_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.asis_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.asis_messages IS 'Messages within ASIS chat sessions';

CREATE INDEX IF NOT EXISTS idx_asis_messages_session_id ON public.asis_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_asis_messages_created_at ON public.asis_messages(created_at DESC);

-- RLS
ALTER TABLE public.asis_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own ASIS messages" ON public.asis_messages;
CREATE POLICY "Users can CRUD own ASIS messages"
    ON public.asis_messages
    FOR ALL
    TO authenticated
    USING (session_id IN (SELECT id FROM public.asis_sessions WHERE user_id = auth.uid()))
    WITH CHECK (session_id IN (SELECT id FROM public.asis_sessions WHERE user_id = auth.uid()));

-- ============================================================================
-- 3. ASIS MEMORIES (Long-term user preferences & facts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asis_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'fact' CHECK (category IN ('preference', 'fact', 'context', 'profile')),
    confidence NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.asis_memories IS 'Long-term memory store for ASIS user preferences and facts';

CREATE INDEX IF NOT EXISTS idx_asis_memories_user_id ON public.asis_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_asis_memories_category ON public.asis_memories(category);
CREATE INDEX IF NOT EXISTS idx_asis_memories_key ON public.asis_memories(key);

-- RLS
ALTER TABLE public.asis_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own ASIS memories" ON public.asis_memories;
CREATE POLICY "Users can CRUD own ASIS memories"
    ON public.asis_memories
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 4. TRIGGER: Auto-update asis_sessions.last_active on new message
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.asis_sessions
    SET last_active = now()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_session_last_active ON public.asis_messages;
CREATE TRIGGER trg_update_session_last_active
    AFTER INSERT ON public.asis_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_session_last_active();

-- ============================================================================
-- 5. TRIGGER: Auto-update asis_memories.updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_update_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_memory_timestamp ON public.asis_memories;
CREATE TRIGGER trg_update_memory_timestamp
    BEFORE UPDATE ON public.asis_memories
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_memory_timestamp();

-- ============================================================================
-- 6. REALTIME ENABLEMENT
-- ============================================================================
BEGIN;
  -- Drop if exists to avoid conflicts
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.asis_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.asis_sessions;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON public.asis_sessions TO authenticated;
GRANT ALL ON public.asis_messages TO authenticated;
GRANT ALL ON public.asis_memories TO authenticated;
GRANT ALL ON public.asis_sessions TO service_role;
GRANT ALL ON public.asis_messages TO service_role;
GRANT ALL ON public.asis_memories TO service_role;

-- ============================================================================
-- DONE
-- ============================================================================
