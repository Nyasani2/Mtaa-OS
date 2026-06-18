-- Add computed view/like counts to streets_posts for the gallery
CREATE OR REPLACE VIEW v_user_profile_media AS
SELECT
  sp.id, sp.user_id, sp.title, sp.caption, sp.media_url, sp.media_urls,
  sp.media_type, sp.duration_seconds, sp.created_at, sp.status, sp.visibility,
  COALESCE(ps.views, 0) as views, COALESCE(ps.likes, 0) as likes,
  COALESCE(ps.comments, 0) as comments, COALESCE(ps.shares, 0) as shares
FROM streets_posts sp
LEFT JOIN post_stats ps ON ps.post_id = sp.id
WHERE sp.is_published = true AND sp.status = 'published'
ORDER BY sp.created_at DESC;
GRANT SELECT ON v_user_profile_media TO anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_streets_posts_user_published
ON streets_posts(user_id, is_published, status)
WHERE is_published = true AND status = 'published';
