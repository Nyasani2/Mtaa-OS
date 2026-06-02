-- MARKETPLACE TABLES (safe migration)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    currency TEXT DEFAULT 'USD',
    category TEXT,
    images TEXT[],
    condition TEXT DEFAULT 'new',
    location TEXT,
    status TEXT DEFAULT 'active',
    views INTEGER DEFAULT 0,
    inquiries INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID,
    quantity INTEGER DEFAULT 1,
    total_price NUMERIC,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    escrow_status TEXT DEFAULT 'held',
    shipping_address TEXT,
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS marketplace_escrow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    amount NUMERIC,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    funded_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    dispute_reason TEXT
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS marketplace_trust (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 50,
    transactions INTEGER DEFAULT 0,
    disputes INTEGER DEFAULT 0,
    resolved_disputes INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    UNIQUE(user_id)
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE marketplace_trust ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- RLS
DO $$ BEGIN ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marketplace_escrow ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE marketplace_trust ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN DROP POLICY IF EXISTS "Public listings" ON marketplace_listings; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Sellers manage" ON marketplace_listings; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Buyers and sellers orders" ON marketplace_orders; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Users own trust" ON marketplace_trust; EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "Public listings" ON marketplace_listings FOR SELECT USING (status = 'active'); EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Sellers manage" ON marketplace_listings FOR ALL USING (auth.uid() = seller_id); EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Buyers and sellers orders" ON marketplace_orders FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id); EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users own trust" ON marketplace_trust FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN undefined_table THEN NULL; END $$;
