-- Edge Function: pulse_search_suggestions
CREATE OR REPLACE FUNCTION pulse_search_suggestions(
  search_query TEXT
)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT psi.title
    FROM pulse_search_index psi
    WHERE psi.is_active = TRUE
      AND psi.title ILIKE search_query || '%'
    ORDER BY psi.title
    LIMIT 8
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
