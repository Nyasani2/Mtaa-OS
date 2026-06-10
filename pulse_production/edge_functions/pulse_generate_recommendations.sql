-- Edge Function: pulse_generate_recommendations
CREATE OR REPLACE FUNCTION pulse_generate_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM pulse_recommendations WHERE user_id = p_user_id AND expires_at < NOW();

  INSERT INTO pulse_recommendations (user_id, rec_type, entity_type, entity_id, entity_name, reason, score, expires_at)
  SELECT p_user_id, 'topic', 'topic', pt.id, pt.name, 'Trending in topics you follow', pt.trending_score, NOW() + INTERVAL '3 days'
  FROM pulse_topics pt
  WHERE pt.is_active = TRUE AND pt.deleted_at IS NULL
    AND pt.id NOT IN (SELECT topic_id FROM pulse_topic_followers WHERE user_id = p_user_id)
  ORDER BY pt.trending_score DESC
  LIMIT p_limit
  ON CONFLICT (user_id, rec_type, entity_id) DO NOTHING;

  INSERT INTO pulse_recommendations (user_id, rec_type, entity_type, entity_id, entity_name, reason, score, expires_at)
  SELECT p_user_id, 'creator', 'creator', pcs.creator_id, 'Creator', 'Top creator in your region', pcs.overall_score, NOW() + INTERVAL '3 days'
  FROM pulse_creator_scores pcs
  WHERE pcs.rank_national <= 100
  ORDER BY pcs.overall_score DESC
  LIMIT p_limit
  ON CONFLICT (user_id, rec_type, entity_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
