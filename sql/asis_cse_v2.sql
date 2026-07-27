-- ASIS CSE v2 — Schema additions

-- Ensure domain column exists on asis_conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'asis_conversations'
      AND column_name = 'domain'
  ) THEN
    ALTER TABLE public.asis_conversations ADD COLUMN domain TEXT;
  END IF;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_asis_conversations_user_id 
  ON public.asis_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_asis_messages_conversation_id 
  ON public.asis_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_asis_messages_created_at 
  ON public.asis_messages(created_at);

-- Trigger to update conversation timestamp on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE asis_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_on_message ON asis_messages;

CREATE TRIGGER trg_update_conversation_on_message
  AFTER INSERT ON asis_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
