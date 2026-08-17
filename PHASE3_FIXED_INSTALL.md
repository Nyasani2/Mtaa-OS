# MTAA SHOP — PHASE 3 FIXED: DELIVERY & LOGISTICS
## Schema-Corrected for shop_orders VIEW

---

## SCHEMA DISCOVERY

`shop_orders` is a **VIEW** on the `orders` table with these columns ONLY:
- `id`, `order_number`, `buyer_user_id`, `shop_id`, `status`
- `payment_method`, `subtotal`, `delivery_fee`, `total_amount`
- `shipping_address`, `notes`, `created_at`, `updated_at`
- `tracking_number`, `courier_name`, `estimated_delivery`, `delivered_at`
- `cancelled_at`, `cancelled_reason`, `discount_amount`, `tax_amount`
- `coupon_code`, `meta_data`

**NO**: `customer_id`, `delivery_address`, `customer_name`, `customer_phone`, `delivery_type`, `payment_status`, `escrow_enabled`, `escrow_account_id`, `pos_session_id`, `is_pos_order`, `affiliate_id`, `delivery_agent_id`

**Solution**: All delivery-specific data lives in `shop_delivery_requests` table.

---

## WHAT'S FIXED

| File | Changes |
|---|---|
| `deliveryService.ts` | Uses `buyer_user_id` not `customer_id`, `shipping_address` not `delivery_address`. All extra fields stored in `shop_delivery_requests` |
| `delivery.tsx` | Queries `shop_delivery_requests` joined to `shop_orders`. Uses `shipping_address`, `buyer_user_id` |
| `delivery-tracking.tsx` | Timeline uses actual `shop_orders` columns. No references to missing fields |
| `driver-app.tsx` | Uses `shipping_address`, `shop_orders` fields only. Status updates through `shop_delivery_requests` |
| `shop-dispatch-edge.ts` | Selects only existing columns from `shop_orders` view |

---

## SQL TO RUN FIRST

```sql
-- Drop broken attempt
DROP TABLE IF EXISTS shop_delivery_requests;

-- Create with NO foreign keys (shop_orders is a view)
CREATE TABLE IF NOT EXISTS shop_delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  shop_id UUID NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'in_house' CHECK (delivery_type IN ('in_house', 'boda', 'mtaxi', 'mtruck')),
  external_trip_id UUID,
  external_module TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
  assigned_agent_id UUID,
  pickup_address TEXT,
  dropoff_address TEXT,
  estimated_distance_km NUMERIC,
  estimated_fare NUMERIC,
  final_fare NUMERIC,
  customer_phone TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shop_delivery_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view their delivery requests"
  ON shop_delivery_requests FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

CREATE POLICY "Delivery agents can view assigned requests"
  ON shop_delivery_requests FOR SELECT
  USING (assigned_agent_id IN (SELECT id FROM shop_staff WHERE user_id = auth.uid()));

CREATE POLICY "Shop owners can insert delivery requests"
  ON shop_delivery_requests FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

CREATE POLICY "Shop owners can update delivery requests"
  ON shop_delivery_requests FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
```

---

## INSTALLATION

```bash
cd ~/MTAA_OS_V10

# Extract
unzip -o ~/Downloads/shop-phase3-delivery-FIXED.zip -d .

# Deploy edge function
supabase functions deploy shop-dispatch

# Add routes
# app/(commerce)/shop/_layout.tsx:
#   <Stack.Screen name="[id]/delivery" />
#   <Stack.Screen name="delivery-tracking" />
# app/(os)/_layout.tsx or driver section:
#   <Stack.Screen name="driver/deliveries" />

# Clear caches
rm -rf node_modules/.cache .expo
watchman watch-del-all 2>/dev/null || true
npx expo start --clear
```

---

## VERIFICATION

- [ ] SQL runs successfully (no FK errors)
- [ ] Open `/(commerce)/shop/{shopId}/delivery` → loads without errors
- [ ] Assign agent → `shop_delivery_requests` created with `assigned_agent_id`
- [ ] Dispatch Boda/MTaxi → `shop_delivery_requests` created with `external_module`
- [ ] Driver app shows tasks where `assigned_agent_id` matches `shop_staff.user_id`
- [ ] Status updates reflect in real-time
- [ ] Tracking screen shows timeline without crashes

---

## NEXT: PHASE 4 — ADVERTISING & BOOST
