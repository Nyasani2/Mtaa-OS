-- RLS Policies for remaining MTAA tables
-- Run in Supabase SQL Editor

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mtaxi_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mtruck_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tribe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civic_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_store_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rail_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Jobs public read" ON jobs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Job poster can modify" ON jobs FOR ALL USING (auth.uid() = posted_by);
CREATE POLICY IF NOT EXISTS "Listings public read" ON marketplace_listings FOR SELECT USING (status = 'active');
CREATE POLICY IF NOT EXISTS "Seller can modify listing" ON marketplace_listings FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY IF NOT EXISTS "Message participants only" ON messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY IF NOT EXISTS "Tribe members read" ON tribe_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Patient owns records" ON health_patients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Provider access" ON health_appointments FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = provider_id);
CREATE POLICY IF NOT EXISTS "Apps public read" ON app_store_apps FOR SELECT USING (status = 'published');
CREATE POLICY IF NOT EXISTS "Recipient only" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Analytics system insert" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Analytics admin read" ON analytics_events FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Rail admin only" ON rail_integrations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
