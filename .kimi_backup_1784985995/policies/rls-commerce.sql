-- MTAA OS V10 — RLS Policies: COMMERCE (Shop, Marketplace, Jobs, Restaurant)

-- shop_items: sellers manage their own, public read for active
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_items_seller ON shop_items;
CREATE POLICY shop_items_seller ON shop_items
  FOR ALL USING (seller_id = auth.uid());
DROP POLICY IF EXISTS shop_items_public ON shop_items;
CREATE POLICY shop_items_public ON shop_items FOR SELECT USING (status = 'active');

-- shop_orders: buyers and sellers see their own orders
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_orders_participants ON shop_orders;
CREATE POLICY shop_orders_participants ON shop_orders
  FOR ALL USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- shop_order_items: via order ownership (implicit through orders)
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_order_items_via_order ON shop_order_items;
CREATE POLICY shop_order_items_via_order ON shop_order_items
  FOR ALL USING (order_id IN (
    SELECT id FROM shop_orders WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  ));

-- shop_carts: user isolation
ALTER TABLE shop_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_carts_user ON shop_carts;
CREATE POLICY shop_carts_user ON shop_carts
  FOR ALL USING (user_id = auth.uid());

-- shop_categories: public read
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shop_categories_public ON shop_categories;
CREATE POLICY shop_categories_public ON shop_categories FOR SELECT USING (true);

-- marketplace_listings: sellers manage, public read for active
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketplace_listings_seller ON marketplace_listings;
CREATE POLICY marketplace_listings_seller ON marketplace_listings
  FOR ALL USING (seller_id = auth.uid());
DROP POLICY IF EXISTS marketplace_listings_public ON marketplace_listings;
CREATE POLICY marketplace_listings_public ON marketplace_listings FOR SELECT USING (status = 'active');

-- marketplace_orders: participants only
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketplace_orders_participants ON marketplace_orders;
CREATE POLICY marketplace_orders_participants ON marketplace_orders
  FOR ALL USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- marketplace_reviews: public read, reviewer can edit/delete
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketplace_reviews_public ON marketplace_reviews;
CREATE POLICY marketplace_reviews_public ON marketplace_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS marketplace_reviews_reviewer ON marketplace_reviews;
CREATE POLICY marketplace_reviews_reviewer ON marketplace_reviews
  FOR ALL USING (reviewer_id = auth.uid());

-- jobs_listings: employers manage, public read for active
ALTER TABLE jobs_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jobs_listings_employer ON jobs_listings;
CREATE POLICY jobs_listings_employer ON jobs_listings
  FOR ALL USING (employer_id = auth.uid());
DROP POLICY IF EXISTS jobs_listings_public ON jobs_listings;
CREATE POLICY jobs_listings_public ON jobs_listings FOR SELECT USING (status = 'active');

-- job_applications: applicants see their own, employers see applications to their listings
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_applications_applicant ON job_applications;
CREATE POLICY job_applications_applicant ON job_applications
  FOR ALL USING (applicant_id = auth.uid());
DROP POLICY IF EXISTS job_applications_employer ON job_applications;
CREATE POLICY job_applications_employer ON job_applications
  FOR ALL USING (listing_id IN (
    SELECT id FROM jobs_listings WHERE employer_id = auth.uid()
  ));

-- employer_profiles: owner only
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS employer_profiles_owner ON employer_profiles;
CREATE POLICY employer_profiles_owner ON employer_profiles
  FOR ALL USING (user_id = auth.uid());

-- restaurant_orders: restaurant staff + customer
ALTER TABLE restaurant_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurant_orders_access ON restaurant_orders;
CREATE POLICY restaurant_orders_access ON restaurant_orders
  FOR ALL USING (
    customer_id = auth.uid() OR
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

-- restaurant_order_items: via order access
ALTER TABLE restaurant_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurant_order_items_access ON restaurant_order_items;
CREATE POLICY restaurant_order_items_access ON restaurant_order_items
  FOR ALL USING (order_id IN (
    SELECT id FROM restaurant_orders WHERE customer_id = auth.uid()
  ));

-- restaurant_menu_items: public read for active restaurants
ALTER TABLE restaurant_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurant_menu_items_public ON restaurant_menu_items;
CREATE POLICY restaurant_menu_items_public ON restaurant_menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS restaurant_menu_items_manager ON restaurant_menu_items;
CREATE POLICY restaurant_menu_items_manager ON restaurant_menu_items
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid() AND role = 'manager'
  ));

-- restaurant_tables: staff only
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurant_tables_staff ON restaurant_tables;
CREATE POLICY restaurant_tables_staff ON restaurant_tables
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
  ));

-- restaurant_inventory: staff only
ALTER TABLE restaurant_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurant_inventory_staff ON restaurant_inventory;
CREATE POLICY restaurant_inventory_staff ON restaurant_inventory
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
  ));

-- restaurant_staff: manager + self
ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurant_staff_self ON restaurant_staff;
CREATE POLICY restaurant_staff_self ON restaurant_staff
  FOR ALL USING (user_id = auth.uid());
