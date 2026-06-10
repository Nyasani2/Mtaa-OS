-- ============================================
-- B1 MARKETPLACE CART/CHECKOUT — SQL CHUNK
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(20, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled')),
    total_amount NUMERIC(20, 2) NOT NULL,
    platform_fee NUMERIC(20, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'KES',
    shipping_address JSONB,
    payment_method TEXT,
    notes TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(20, 2) NOT NULL,
    total_price NUMERIC(20, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create order_disputes table
CREATE TABLE IF NOT EXISTS order_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'cancelled')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_disputes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies — cart_items
CREATE POLICY "Users can view own cart" ON cart_items
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own cart" ON cart_items
    FOR ALL USING (user_id = auth.uid());

-- 7. RLS Policies — orders
CREATE POLICY "Buyers can view own orders" ON orders
    FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can view their orders" ON orders
    FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- 8. RLS Policies — order_items
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
        )
    );

-- 9. RLS Policies — order_disputes
CREATE POLICY "Users can view own disputes" ON order_disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_disputes.order_id 
            AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can raise disputes" ON order_disputes
    FOR INSERT WITH CHECK (raised_by = auth.uid());

-- 10. RPC: reserve_marketplace_funds
CREATE OR REPLACE FUNCTION reserve_marketplace_funds(
    p_wallet_id UUID,
    p_amount NUMERIC,
    p_order_id UUID,
    p_buyer_id UUID,
    p_seller_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance NUMERIC;
    v_status TEXT;
BEGIN
    SELECT balance, status INTO v_balance, v_status
    FROM wallets WHERE id = p_wallet_id FOR UPDATE;

    IF v_status != 'active' THEN
        RAISE EXCEPTION 'Wallet not active';
    END IF;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance: % < %', v_balance, p_amount;
    END IF;

    -- Debit buyer wallet
    UPDATE wallets 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = p_wallet_id;

    -- Create escrow for seller payout
    INSERT INTO escrow_accounts (
        id, transaction_id, wallet_id, user_id, amount, currency, status, type, created_at, expires_at
    )
    SELECT
        gen_random_uuid(),
        p_order_id,
        p_wallet_id,
        p_seller_id,
        p_amount,
        w.currency,
        'held',
        'marketplace_escrow',
        NOW(),
        NOW() + INTERVAL '14 days'
    FROM wallets w
    WHERE w.id = p_wallet_id;

    -- Audit log
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (
        gen_random_uuid(),
        p_buyer_id,
        'marketplace_funds_reserved',
        'escrow',
        p_order_id,
        jsonb_build_object(
            'wallet_id', p_wallet_id,
            'amount', p_amount,
            'seller_id', p_seller_id,
            'balance_before', v_balance,
            'balance_after', v_balance - p_amount
        ),
        NOW()
    );
END;
$$;

-- 11. RPC: confirm_delivery (release escrow to seller)
CREATE OR REPLACE FUNCTION confirm_delivery(
    p_order_id UUID,
    p_buyer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_escrow RECORD;
    v_seller_wallet UUID;
BEGIN
    -- Verify order exists and buyer owns it
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id AND buyer_id = p_buyer_id AND status IN ('shipped', 'delivered')
    FOR UPDATE;

    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found or not eligible for confirmation';
    END IF;

    -- Get escrow
    SELECT * INTO v_escrow
    FROM escrow_accounts
    WHERE transaction_id = p_order_id AND status = 'held'
    FOR UPDATE;

    IF v_escrow IS NULL THEN
        RAISE EXCEPTION 'Escrow not found for this order';
    END IF;

    -- Get seller wallet
    SELECT id INTO v_seller_wallet
    FROM wallets
    WHERE user_id = v_order.seller_id AND currency = v_order.currency;

    IF v_seller_wallet IS NULL THEN
        RAISE EXCEPTION 'Seller wallet not found';
    END IF;

    -- Credit seller wallet (minus platform fee already deducted)
    UPDATE wallets
    SET balance = balance + v_escrow.amount - v_order.platform_fee,
        updated_at = NOW()
    WHERE id = v_seller_wallet;

    -- Release escrow
    UPDATE escrow_accounts
    SET status = 'released',
        released_at = NOW(),
        updated_at = NOW()
    WHERE transaction_id = p_order_id;

    -- Update order status
    UPDATE orders
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Create seller transaction
    INSERT INTO transactions (id, user_id, wallet_id, type, amount, currency, fee, net_amount, status, description, created_at)
    VALUES (
        gen_random_uuid(),
        v_order.seller_id,
        v_seller_wallet,
        'marketplace_sale',
        v_escrow.amount,
        v_order.currency,
        v_order.platform_fee,
        v_escrow.amount - v_order.platform_fee,
        'completed',
        `Sale completed — Order ${p_order_id}`,
        NOW()
    );

    -- Audit log
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (
        gen_random_uuid(),
        p_buyer_id,
        'delivery_confirmed',
        'order',
        p_order_id,
        jsonb_build_object(
            'seller_id', v_order.seller_id,
            'amount', v_escrow.amount,
            'platform_fee', v_order.platform_fee
        ),
        NOW()
    );

END;
$$;

-- 12. RPC: decrement_inventory
CREATE OR REPLACE FUNCTION decrement_inventory(
    p_listing_id UUID,
    p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE marketplace_inventory
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE listing_id = p_listing_id;
END;
$$;

-- 13. Auto-update order updated_at
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_update_trigger ON orders;
CREATE TRIGGER order_update_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_timestamp();

-- 14. Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_order_id ON order_disputes(order_id);

-- 15. Grant execute permissions
GRANT EXECUTE ON FUNCTION reserve_marketplace_funds(UUID, NUMERIC, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_delivery(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_inventory(UUID, INTEGER) TO authenticated;
