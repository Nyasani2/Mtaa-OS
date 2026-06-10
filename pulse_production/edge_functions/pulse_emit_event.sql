-- Edge Function: pulse_emit_event
CREATE OR REPLACE FUNCTION pulse_emit_event(
  p_source TEXT,
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_payload JSONB DEFAULT '{}',
  p_severity TEXT DEFAULT 'info',
  p_region TEXT DEFAULT NULL,
  p_county TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO pulse_events (source, event_type, entity_type, entity_id, user_id, payload, severity, region, county)
  VALUES (p_source, p_event_type, p_entity_type, p_entity_id, p_user_id, p_payload, p_severity, p_region, p_county)
  RETURNING id INTO v_event_id;
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
