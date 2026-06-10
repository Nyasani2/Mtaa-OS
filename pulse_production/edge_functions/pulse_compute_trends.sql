-- Edge Function: pulse_compute_trends
CREATE OR REPLACE FUNCTION pulse_compute_trends(
  p_period TEXT DEFAULT 'daily'
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM pulse_trends WHERE period = p_period AND expires_at < NOW();

  INSERT INTO pulse_trends (entity_type, entity_id, entity_name, score, velocity, view_count, engagement_count, region, period, rank, expires_at)
  SELECT
    pe.entity_type,
    pe.entity_id,
    COALESCE(psi.title, pe.entity_id::TEXT) AS entity_name,
    COUNT(*)::NUMERIC * CASE pe.severity WHEN 'critical' THEN 10 WHEN 'warning' THEN 5 ELSE 1 END AS score,
    COUNT(*)::NUMERIC / NULLIF(EXTRACT(EPOCH FROM (NOW() - MIN(pe.created_at))) / 3600, 0) AS velocity,
    COUNT(*) FILTER (WHERE pe.event_type = 'view')::INTEGER AS view_count,
    COUNT(*) FILTER (WHERE pe.event_type IN ('like','comment','share'))::INTEGER AS engagement_count,
    pe.region,
    p_period,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
    NOW() + CASE p_period WHEN 'hourly' THEN INTERVAL '1 hour' WHEN 'daily' THEN INTERVAL '1 day' WHEN 'weekly' THEN INTERVAL '7 days' WHEN 'monthly' THEN INTERVAL '30 days' END
  FROM pulse_events pe
  LEFT JOIN pulse_search_index psi ON pe.entity_id = psi.entity_id
  WHERE pe.created_at > CASE p_period WHEN 'hourly' THEN NOW() - INTERVAL '1 hour' WHEN 'daily' THEN NOW() - INTERVAL '1 day' WHEN 'weekly' THEN NOW() - INTERVAL '7 days' WHEN 'monthly' THEN NOW() - INTERVAL '30 days' END
    AND pe.processed = TRUE
  GROUP BY pe.entity_type, pe.entity_id, pe.region, psi.title
  HAVING COUNT(*) > 1
  ON CONFLICT (entity_type, entity_id, period, region) DO UPDATE SET
    score = EXCLUDED.score,
    velocity = EXCLUDED.velocity,
    view_count = EXCLUDED.view_count,
    engagement_count = EXCLUDED.engagement_count,
    rank = EXCLUDED.rank,
    expires_at = EXCLUDED.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
