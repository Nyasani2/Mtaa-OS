-- ============================================================
-- MTAA OS Calendar Schema
-- Tables: calendar_events, calendar_reminders
-- ============================================================

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Timing
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'Africa/Nairobi',

  -- Categorization
  category TEXT DEFAULT 'personal' CHECK (category IN (
    'work', 'personal', 'health', 'finance', 'education', 
    'social', 'transport', 'civic', 'family', 'other'
  )),

  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN (
    'daily', 'weekly', 'monthly', 'yearly', 'custom'
  )),
  recurrence_end_date DATE,
  recurrence_days INTEGER[], -- For weekly: [1,3,5] = Mon,Wed,Fri

  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Search
  search_vector TSVECTOR
);

-- Calendar Reminders Table
CREATE TABLE IF NOT EXISTS calendar_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reminder timing (minutes before event)
  minutes_before INTEGER NOT NULL DEFAULT 15,
  reminder_type TEXT DEFAULT 'notification' CHECK (reminder_type IN (
    'notification', 'email', 'sms', 'push'
  )),

  -- Status
  is_triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_category ON calendar_events(category);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_event_id ON calendar_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_user_id ON calendar_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_triggered ON calendar_reminders(is_triggered) WHERE is_triggered = FALSE;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_calendar_events_search ON calendar_events USING GIN(search_vector);

-- Update search vector trigger
CREATE OR REPLACE FUNCTION update_calendar_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calendar_search_update ON calendar_events;
CREATE TRIGGER calendar_search_update
  BEFORE INSERT OR UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_search_vector();

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calendar_events_updated_at ON calendar_events;
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own events"
  ON calendar_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own reminders"
  ON calendar_reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Edge Function: Check and trigger reminders
CREATE OR REPLACE FUNCTION check_reminders()
RETURNS TABLE(
  reminder_id UUID,
  event_id UUID,
  user_id UUID,
  event_title TEXT,
  event_start TIMESTAMPTZ,
  minutes_before INTEGER,
  reminder_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.event_id,
    r.user_id,
    e.title,
    (e.start_date + COALESCE(e.start_time, '00:00:00'::TIME))::TIMESTAMPTZ,
    r.minutes_before,
    r.reminder_type
  FROM calendar_reminders r
  JOIN calendar_events e ON r.event_id = e.id
  WHERE r.is_triggered = FALSE
    AND (e.start_date + COALESCE(e.start_time, '00:00:00'::TIME))::TIMESTAMPTZ - INTERVAL '1 minute' * r.minutes_before <= NOW()
    AND e.status = 'confirmed';
END;
$$ LANGUAGE plpgsql;
