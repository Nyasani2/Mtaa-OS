-- Edge Function: pulse_search
CREATE OR REPLACE FUNCTION pulse_search(
  search_query TEXT,
  entity_type TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  description TEXT,
  tags TEXT[],
  metadata JSONB,
  region TEXT,
  county TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    psi.id,
    psi.entity_type,
    psi.entity_id,
    psi.title,
    psi.description,
    psi.tags,
    psi.metadata,
    psi.region,
    psi.county,
    ts_rank(psi.content_vector, plainto_tsquery('english', search_query))::REAL AS rank
  FROM pulse_search_index psi
  WHERE psi.is_active = TRUE
    AND psi.content_vector @@ plainto_tsquery('english', search_query)
    AND (entity_type IS NULL OR psi.entity_type = entity_type)
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
