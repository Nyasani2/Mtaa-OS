-- Edge Function: pulse_get_dashboard_metrics
CREATE OR REPLACE FUNCTION pulse_get_dashboard_metrics(
  p_region TEXT DEFAULT NULL,
  p_period TEXT DEFAULT 'daily'
)
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT,
  change_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.metric_name,
    pa.metric_value,
    pa.metric_unit,
    COALESCE(((pa.metric_value - prev.metric_value) / NULLIF(prev.metric_value, 0) * 100)::NUMERIC, 0) AS change_percent
  FROM pulse_analytics pa
  LEFT JOIN LATERAL (
    SELECT metric_value FROM pulse_analytics pa2
    WHERE pa2.metric_name = pa.metric_name AND pa2.period = pa.period AND pa2.region IS NOT DISTINCT FROM pa.region AND pa2.snapshot_at < pa.snapshot_at
    ORDER BY pa2.snapshot_at DESC LIMIT 1
  ) prev ON TRUE
  WHERE pa.period = p_period AND (p_region IS NULL OR pa.region = p_region)
    AND pa.snapshot_at = (SELECT MAX(snapshot_at) FROM pulse_analytics pa3 WHERE pa3.metric_name = pa.metric_name AND pa3.period = pa.period AND pa3.region IS NOT DISTINCT FROM pa.region)
  ORDER BY pa.metric_value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
