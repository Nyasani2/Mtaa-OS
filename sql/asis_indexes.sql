-- Add missing indexes for ASIS performance
-- (Your tables already exist — this just adds indexes)

CREATE INDEX IF NOT EXISTS idx_asis_conversations_user_id 
  ON public.asis_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_asis_messages_conversation_id 
  ON public.asis_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_asis_messages_created_at 
  ON public.asis_messages(created_at);

-- Update updated_at on conversation when new message arrives
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE asis_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists to avoid duplicate trigger error
DROP TRIGGER IF EXISTS trg_update_conversation_on_message ON asis_messages;

CREATE TRIGGER trg_update_conversation_on_message
  AFTER INSERT ON asis_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
