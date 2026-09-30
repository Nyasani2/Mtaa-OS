CREATE TABLE IF NOT EXISTS public.asis_activity_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('SYS', 'TOOL', 'MODEL_SWITCH', 'ERROR')),
  event_name TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asis_activity_user_time ON public.asis_activity_stream(user_id, created_at DESC);
ALTER TABLE public.asis_activity_stream ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON public.asis_activity_stream;
CREATE POLICY "Users can view own activity" ON public.asis_activity_stream FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Edge functions can insert activity" ON public.asis_activity_stream;
CREATE POLICY "Edge functions can insert activity" ON public.asis_activity_stream FOR INSERT WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.asis_activity_stream;
