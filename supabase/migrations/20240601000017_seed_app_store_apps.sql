-- Run this in Supabase SQL Editor to populate app_store_apps
-- so the registry can load non-native apps properly

INSERT INTO app_store_apps (id, name, version, description, category, icon, color, author, size_mb, min_os_version, permissions, routes, entry_route, is_native, is_paid, price_usd, api_version, dependencies, status, install_count, rating, review_count)
VALUES
  ('mtaxi', 'MTaxi', '1.0.0', 'Ride-hailing across Africa', 'mobility', 'car', '#F59E0B', 'MTAA', 12, '1.0.0', '[{"id":"location","name":"Location","description":"Track rides","required":true}]', '["/(mtaxi)"]', '/(mtaxi)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('mtruck', 'MTruck', '1.0.0', 'Logistics and fleet management', 'mobility', 'truck', '#8B5CF6', 'MTAA', 15, '1.0.0', '[{"id":"location","name":"Location","description":"Track trucks","required":true}]', '["/(mtruck)"]', '/(mtruck)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('marketplace', 'Marketplace', '1.0.0', 'Buy and sell goods', 'commerce', 'shopping-bag', '#10B981', 'MTAA', 10, '1.0.0', '[]', '["/(marketplace)"]', '/(marketplace)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('shop', 'Shop', '1.0.0', 'Local business storefronts', 'commerce', 'store', '#EC4899', 'MTAA', 8, '1.0.0', '[]', '["/(shop)"]', '/(shop)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('tribes', 'Tribes', '1.0.0', 'Community groups and forums', 'social', 'users', '#3B82F6', 'MTAA', 9, '1.0.0', '[]', '["/(tribes)"]', '/(tribes)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('streets', 'Streets', '1.0.0', 'Neighborhood news and events', 'social', 'map', '#6366F1', 'MTAA', 7, '1.0.0', '[{"id":"location","name":"Location","description":"Local content","required":false}]', '["/(streets)"]', '/(streets)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('jobs', 'Jobs', '1.0.0', 'Find work and hire talent', 'productivity', 'briefcase', '#14B8A6', 'MTAA', 8, '1.0.0', '[]', '["/(jobs)"]', '/(jobs)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('education', 'Education', '1.0.0', 'Courses and certifications', 'education', 'graduation-cap', '#F97316', 'MTAA', 11, '1.0.0', '[]', '["/(education)"]', '/(education)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('hookup', 'Hookup', '1.0.0', 'Dating and connections', 'social', 'heart', '#EF4444', 'MTAA', 6, '1.0.0', '[]', '["/(hookup)"]', '/(hookup)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('civic', 'Civic', '1.0.0', 'Government services access', 'civic', 'landmark', '#1E40AF', 'MTAA', 14, '1.0.0', '[{"id":"identity","name":"Identity","description":"KYC verification","required":true}]', '["/(civic)"]', '/(civic)', true, false, 0, 1, '[]', 'published', 0, 0, 0),
  ('ads', 'Ads', '1.0.0', 'Advertise your business', 'commerce', 'megaphone', '#F59E0B', 'MTAA', 5, '1.0.0', '[]', '["/(ads)"]', '/(ads)', true, false, 0, 1, '[]', 'published', 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  version = EXCLUDED.version,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  entry_route = EXCLUDED.entry_route,
  routes = EXCLUDED.routes,
  status = 'published',
  updated_at = now();
