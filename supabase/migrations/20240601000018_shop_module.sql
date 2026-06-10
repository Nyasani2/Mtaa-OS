-- ============================================================
-- MTAA AFRIQ SHOP MODULE - CORRECTED SQL Schema
-- escrow_accounts.status uses escrow_status enum (pending, funded, released, disputed, refunded, expired)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE SHOP TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    sub_categories TEXT[] DEFAULT '{}',
    logo_url TEXT,
    banner_url TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'ZA',
    postal_code TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    registration_number TEXT,
    tax_number TEXT,
    business_type TEXT,
    operating_hours JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{"currency": "ZAR", "tax_rate": 15, "allow_pickup": true, "allow_delivery": true, "delivery_radius_km": 25, "min_order_amount": 0, "pos_enabled": true, "affiliate_enabled": false, "escrow_enabled": true, "auto_accept_orders": false}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    rating NUMERIC(2,1) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    total_sales NUMERIC(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'manager', 'cashier', 'inventory_manager', 'delivery_agent')),
    permissions JSONB DEFAULT '[]',
    pin_code TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    barcode TEXT,
    qr_code TEXT,
    base_price NUMERIC(12,2) NOT NULL,
    sale_price NUMERIC(12,2),
    cost_price NUMERIC(12,2),
    tax_inclusive BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    stock_alert_level INTEGER DEFAULT 10,
    track_inventory BOOLEAN DEFAULT true,
    allow_backorders BOOLEAN DEFAULT false,
    variants JSONB DEFAULT '[]',
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_digital BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'return', 'adjustment', 'transfer_in', 'transfer_out', 'damage', 'expired')),
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(12,2),
    total_cost NUMERIC(12,2),
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    supplier_id UUID,
    supplier_name TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'received', 'cancelled')),
    total_items INTEGER DEFAULT 0,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    expected_delivery_date DATE,
    received_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES shop_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES shop_staff(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC(12,2) DEFAULT 0,
    closing_cash NUMERIC(12,2),
    expected_cash NUMERIC(12,2),
    cash_difference NUMERIC(12,2),
    total_sales NUMERIC(12,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_refunds NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'verified')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded')),
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    delivery_address TEXT,
    delivery_notes TEXT,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    delivery_fee NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
    payment_method TEXT,
    escrow_enabled BOOLEAN DEFAULT false,
    escrow_account_id UUID,
    escrow_released_at TIMESTAMPTZ,
    affiliate_id UUID,
    affiliate_commission NUMERIC(12,2) DEFAULT 0,
    delivery_type TEXT DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery', 'shipping')),
    delivery_agent_id UUID REFERENCES shop_staff(id),
    delivered_at TIMESTAMPTZ,
    delivery_receipt_scanned BOOLEAN DEFAULT false,
    delivery_receipt_url TEXT,
    pos_session_id UUID REFERENCES pos_sessions(id),
    is_pos_order BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES shop_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    variant_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    sub_type TEXT,
    parent_id UUID REFERENCES shop_accounts(id) ON DELETE SET NULL,
    opening_balance NUMERIC(12,2) DEFAULT 0,
    current_balance NUMERIC(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    entry_number TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id UUID,
    total_debit NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_reversed BOOLEAN DEFAULT false,
    reversed_by UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES shop_journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES shop_accounts(id) ON DELETE CASCADE,
    description TEXT,
    debit NUMERIC(12,2) DEFAULT 0,
    credit NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    receipt_url TEXT,
    paid_by TEXT,
    expense_date DATE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_affiliate_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
    commission_value NUMERIC(12,2) DEFAULT 10,
    tier_rules JSONB DEFAULT '[]',
    cookie_duration_days INTEGER DEFAULT 30,
    min_payout_amount NUMERIC(12,2) DEFAULT 100,
    payout_method TEXT DEFAULT 'wallet' CHECK (payout_method IN ('wallet', 'bank', 'mobile_money')),
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    referral_link TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_earnings NUMERIC(12,2) DEFAULT 0,
    total_paid NUMERIC(12,2) DEFAULT 0,
    balance NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_affiliate_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES shop_affiliates(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    commission_amount NUMERIC(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    marketplace_price NUMERIC(12,2),
    marketplace_description TEXT,
    marketplace_images TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_promoted BOOLEAN DEFAULT false,
    priority_score INTEGER DEFAULT 0,
    marketplace_views INTEGER DEFAULT 0,
    marketplace_sales INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'sold_out', 'removed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'shop', 'system')),
    message TEXT NOT NULL,
    product_id UUID REFERENCES shop_products(id),
    order_id UUID REFERENCES shop_orders(id),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES shop_orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    shop_response TEXT,
    shop_responded_at TIMESTAMPTZ,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_shops_status ON shops(status);
CREATE INDEX idx_shops_category ON shops(category);
CREATE INDEX idx_shops_location ON shops(latitude, longitude);
CREATE INDEX idx_shop_products_shop ON shop_products(shop_id);
CREATE INDEX idx_shop_products_category ON shop_products(category_id);
CREATE INDEX idx_shop_products_barcode ON shop_products(barcode);
CREATE INDEX idx_shop_products_active ON shop_products(is_active);
CREATE INDEX idx_shop_orders_shop ON shop_orders(shop_id);
CREATE INDEX idx_shop_orders_customer ON shop_orders(customer_id);
CREATE INDEX idx_shop_orders_status ON shop_orders(status);
CREATE INDEX idx_shop_orders_created ON shop_orders(created_at);
CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX idx_shop_affiliates_user ON shop_affiliates(user_id);
CREATE INDEX idx_shop_affiliates_code ON shop_affiliates(referral_code);
CREATE INDEX idx_marketplace_listings_shop ON marketplace_listings(shop_id);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_shop_messages_shop_customer ON shop_messages(shop_id, customer_id);
CREATE INDEX idx_shop_messages_unread ON shop_messages(is_read) WHERE is_read = false;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops owner full access" ON shops FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Shops public view" ON shops FOR SELECT USING (status = 'active');
CREATE POLICY "Shop staff access" ON shop_staff FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Products shop manage" ON shop_products FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "Products public view" ON shop_products FOR SELECT USING (shop_id IN (SELECT id FROM shops WHERE status = 'active') AND is_active = true);
CREATE POLICY "Orders shop manage" ON shop_orders FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "Orders customer view" ON shop_orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Messages participants" ON shop_messages FOR ALL USING (customer_id = auth.uid() OR shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "Affiliates user view" ON shop_affiliates FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Reviews public view" ON shop_reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Reviews customer manage" ON shop_reviews FOR ALL USING (customer_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_shop_metrics() RETURNS TRIGGER AS $$ BEGIN IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN UPDATE shops SET total_sales = total_sales + NEW.total_amount, total_orders = total_orders + 1, updated_at = NOW() WHERE id = NEW.shop_id; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_shop_metrics AFTER UPDATE ON shop_orders FOR EACH ROW EXECUTE FUNCTION update_shop_metrics();

CREATE OR REPLACE FUNCTION create_inventory_sale_transaction() RETURNS TRIGGER AS $$ BEGIN INSERT INTO inventory_transactions (shop_id, product_id, type, quantity, unit_cost, total_cost, reference_type, reference_id, performed_by) SELECT o.shop_id, oi.product_id, 'sale', -oi.quantity, p.cost_price, -oi.quantity * COALESCE(p.cost_price, 0), 'order', o.id, o.customer_id FROM shop_orders o JOIN shop_order_items oi ON o.id = oi.order_id LEFT JOIN shop_products p ON oi.product_id = p.id WHERE o.id = NEW.id AND NEW.status = 'delivered' AND OLD.status != 'delivered'; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_inventory_sale AFTER UPDATE ON shop_orders FOR EACH ROW WHEN (NEW.status = 'delivered' AND OLD.status != 'delivered') EXECUTE FUNCTION create_inventory_sale_transaction();

CREATE OR REPLACE FUNCTION update_product_stock() RETURNS TRIGGER AS $$ BEGIN UPDATE shop_products SET stock_quantity = stock_quantity + NEW.quantity, updated_at = NOW() WHERE id = NEW.product_id; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_stock AFTER INSERT ON inventory_transactions FOR EACH ROW EXECUTE FUNCTION update_product_stock();

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shop_products_updated_at BEFORE UPDATE ON shop_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shop_orders_updated_at BEFORE UPDATE ON shop_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shop_affiliates_updated_at BEFORE UPDATE ON shop_affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA: Default Chart of Accounts
-- ============================================================
INSERT INTO shop_accounts (shop_id, code, name, type, sub_type, opening_balance)
SELECT id, code, name, type, sub_type, 0
FROM shops
CROSS JOIN (VALUES ('1000','Cash on Hand','asset','cash'), ('1100','Bank Account','asset','bank'), ('1200','Accounts Receivable','asset','receivable'), ('1300','Inventory','asset','inventory'), ('2000','Accounts Payable','liability','payable'), ('2100','Sales Tax Payable','liability','tax'), ('3000','Owner Equity','equity','equity'), ('4000','Sales Revenue','revenue','sales'), ('4100','Shipping Revenue','revenue','shipping'), ('5000','Cost of Goods Sold','expense','cogs'), ('6000','Rent Expense','expense','rent'), ('6100','Utilities Expense','expense','utilities'), ('6200','Salaries Expense','expense','salaries'), ('6300','Marketing Expense','expense','marketing')) AS defaults(code, name, type, sub_type)
WHERE NOT EXISTS (SELECT 1 FROM shop_accounts WHERE shop_accounts.shop_id = shops.id);

-- ============================================================
-- FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION get_shop_dashboard(shop_uuid UUID) RETURNS JSONB AS $$ DECLARE result JSONB; BEGIN SELECT jsonb_build_object('total_revenue', COALESCE(SUM(total_amount), 0), 'total_orders', COUNT(*), 'pending_orders', COUNT(*) FILTER (WHERE status = 'pending'), 'low_stock_items', (SELECT COUNT(*) FROM shop_products WHERE shop_id = shop_uuid AND stock_quantity <= stock_alert_level), 'today_sales', COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0), 'today_orders', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)) INTO result FROM shop_orders WHERE shop_id = shop_uuid AND status = 'delivered'; RETURN result; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_affiliate_commission(p_affiliate_id UUID, p_order_amount NUMERIC) RETURNS NUMERIC AS $$ DECLARE program shop_affiliate_programs%ROWTYPE; commission NUMERIC; BEGIN SELECT * INTO program FROM shop_affiliate_programs WHERE shop_id = (SELECT shop_id FROM shop_affiliates WHERE id = p_affiliate_id); IF program.commission_type = 'percentage' THEN commission := p_order_amount * (program.commission_value / 100); ELSIF program.commission_type = 'fixed' THEN commission := program.commission_value; ELSIF program.commission_type = 'tiered' THEN commission := p_order_amount * (program.commission_value / 100); END IF; RETURN COALESCE(commission, 0); END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$ BEGIN RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'); END; $$ LANGUAGE plpgsql;

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE shop_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_transactions;
