# MTAA SHOP — PHASE 3: DELIVERY & LOGISTICS
## Delivery Management • Boda/MTaxi Dispatch • Driver App • Tracking

---

## WHAT'S IN THIS PACKAGE

| File | Target Path | Purpose |
|---|---|---|
| `deliveryService.ts` | `domains/shop/services/deliveryService.ts` | In-house agents, Boda/MTaxi/MTruck dispatch, status updates, escrow auto-release |
| `delivery.tsx` | `app/(commerce)/shop/[id]/delivery.tsx` | Merchant delivery management — assign agents, dispatch external, track orders |
| `delivery-tracking.tsx` | `app/(commerce)/shop/delivery-tracking.tsx` | Customer + merchant tracking screen — timeline, confirm delivery, release escrow |
| `driver-app.tsx` | `app/(os)/driver/deliveries.tsx` (or similar) | Driver/Agent app — view tasks, update status, call/navigate |
| `shop-dispatch-edge.ts` | `supabase/functions/shop-dispatch/index.ts` | Edge function bridge to Boda/MTaxi/MTruck modules |

---

## ARCHITECTURE

### Delivery Types
| Type | Source | Use Case |
|---|---|---|
| `in_house` | `shop_staff` with `role = 'delivery_agent'` | Shop owns delivery fleet |
| `boda` | `boda_trips` via `boda-operations` edge function | Motorcycle delivery |
| `mtaxi` | `mtaxi_rides` via `mtaxi-request` edge function | Car/taxi delivery |
| `mtruck` | `mtruck_trips` via `mtruck-dispatch` edge function | Bulk/heavy delivery |

### Status Flow
```
pending → confirmed → preparing → ready → out_for_delivery → delivered
                          ↓
                    cancelled (by merchant/customer)
```

### Escrow Auto-Release
When driver marks order as `delivered`:
1. `shop_orders.status` → `delivered`
2. `shop_orders.delivered_at` → current timestamp
3. If `escrow_enabled = true` → `shopPaymentService.releaseEscrow(orderId)` auto-calls
4. Seller wallet credited

---

## NEW TABLE REQUIRED

```sql
CREATE TABLE IF NOT EXISTS shop_delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('in_house', 'boda', 'mtaxi', 'mtruck')),
  external_trip_id UUID,
  external_module TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
  assigned_agent_id UUID REFERENCES shop_staff(id),
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

-- Enable RLS
ALTER TABLE shop_delivery_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
unzip -o ~/Downloads/shop-phase3-delivery.zip -d .

# Deploy edge function
supabase functions deploy shop-dispatch

# Add routes
# app/(commerce)/shop/_layout.tsx:
#   <Stack.Screen name="[id]/delivery" options={{ title: 'Delivery' }} />
#   <Stack.Screen name="delivery-tracking" options={{ title: 'Track Delivery' }} />
# app/(os)/_layout.tsx or driver section:
#   <Stack.Screen name="driver/deliveries" options={{ title: 'My Deliveries' }} />

# Clear caches
rm -rf node_modules/.cache .expo
watchman watch-del-all 2>/dev/null || true
npx expo start --clear
```

---

## VERIFICATION CHECKLIST

### Merchant Delivery Management
- [ ] Open `/(commerce)/shop/{shopId}/delivery`
- [ ] See pending/active/completed tabs with order counts
- [ ] Tap "Assign Agent" → see list of `shop_staff` with delivery role → assign
- [ ] Order status changes to `out_for_delivery`
- [ ] Tap "Dispatch Boda/MTaxi" → enter pickup/dropoff coords → dispatch
- [ ] `shop_delivery_requests` record created with `external_trip_id`

### Customer Tracking
- [ ] Open `/(commerce)/shop/delivery-tracking?orderId={id}`
- [ ] See timeline: Order Placed → Confirmed → Preparing → Ready → Out for Delivery → Delivered
- [ ] Active order shows "Confirm Delivery" button
- [ ] Tap confirm → status → `delivered` → escrow auto-released

### Driver App
- [ ] Open driver deliveries screen
- [ ] See assigned orders for logged-in user (matched via `shop_staff.user_id`)
- [ ] Tap "Picked Up" → "In Transit" → "Delivered"
- [ ] Each status update reflects in merchant + customer views via realtime
- [ ] Tap "Call Customer" → opens dialer
- [ ] Tap "Navigate" → opens Google Maps

### Edge Function
- [ ] Call `shop-dispatch` with boda type → creates `boda_trips` record
- [ ] Call with mtaxi type → creates `mtaxi_rides` record
- [ ] Returns `external_id` + `estimated_fare`

---

## NEXT: PHASE 4 — ADVERTISING & BOOST

- `shop_ad_campaigns` table + edge function
- "Boost Product" button wiring
- Geographic targeting
- Ad impression tracking
