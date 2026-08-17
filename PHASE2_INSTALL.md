# MTAA SHOP — PHASE 2: WALLET & PAYMENT INTEGRATION
## POS • Scan • Checkout • Wallet Payment • Escrow

---

## WHAT'S IN THIS PACKAGE

| File | Target Path | Purpose |
|---|---|---|
| `posService.ts` | `domains/shop/services/posService.ts` | Staff PIN auth, POS session CRUD |
| `shopPaymentService.ts` | `domains/shop/services/shopPaymentService.ts` | Wallet-to-shop payment, escrow handling |
| `pos.tsx` | `app/(commerce)/shop/[id]/pos.tsx` | POS terminal — staff login, cart, checkout |
| `scan.tsx` | `app/(commerce)/shop/scan.tsx` | Barcode/QR scanner — sell or inventory mode |
| `checkout.tsx` | `app/(commerce)/shop/checkout.tsx` | Checkout screen — wallet/cash/card/escrow |

---

## ARCHITECTURE DECISIONS

### PIN Systems (NO DUPLICATES)
- **Staff POS Login** → `shop_staff.pin_code` (per-shop PIN, stored in schema)
- **Customer Wallet Payment** → `useAuthStore.verifyPin()` (global PIN via `pinEngine`, existing system)

### Wallet Integration
- Uses existing `lib/services/wallet-service.ts` (`ensureWallet`, `createWalletTransaction`)
- Buyer wallet debited → Shop owner wallet credited (or escrow held)
- No new wallet tables created

### Escrow Flow
- If `shops.settings.escrow_enabled = true`:
  1. Buyer wallet debited
  2. Funds held in `escrow_accounts` table
  3. Shop owner receives nothing until delivery confirmed
  4. `shopPaymentService.releaseEscrow(orderId)` releases funds

### POS Flow
1. Staff enters 4-digit PIN → verified against `shop_staff.pin_code`
2. `pos_sessions` record created with `status: 'open'`
3. Staff adds products (tap grid or scan barcode)
4. Checkout → payment method selected
5. If wallet → customer enters 6-digit global PIN → payment processed
6. Session can be closed with cash reconciliation

---

## INSTALLATION

```bash
cd ~/MTAA_OS_V10

# Backup existing files
cp domains/shop/services/shopService.ts domains/shop/services/shopService.ts.bak.phase2 2>/dev/null || true

# Extract package
unzip -o ~/Downloads/shop-phase2-wallet-pos.zip -d .

# Clear caches
rm -rf node_modules/.cache .expo
watchman watch-del-all 2>/dev/null || true

# Restart
npx expo start --clear
```

---

## REQUIRED ROUTES

Add these to your Expo Router layout if not present:

```tsx
// app/(commerce)/shop/_layout.tsx or similar
<Stack.Screen name="[id]/pos" options={{ title: 'POS Terminal' }} />
<Stack.Screen name="scan" options={{ title: 'Scan' }} />
<Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
```

---

## VERIFICATION CHECKLIST

### POS Terminal
- [ ] Navigate to `/(commerce)/shop/{shopId}/pos`
- [ ] Enter staff PIN (must exist in `shop_staff.pin_code`)
- [ ] POS unlocks, session created in `pos_sessions` table
- [ ] Tap product → adds to cart
- [ ] Tap scan button → opens scan screen
- [ ] Adjust quantity / remove items
- [ ] Tap "Cash" → enter received amount → checkout
- [ ] Tap "Wallet" → navigates to checkout
- [ ] Close session → `pos_sessions.status` = 'closed'

### Scan Screen
- [ ] Open `/(commerce)/shop/scan?shopId={id}&mode=sell`
- [ ] Enter barcode manually → finds product → adds to cart
- [ ] Open with `mode=inventory` → scan unknown barcode → create product modal
- [ ] Create product → appears in shop inventory

### Checkout + Wallet
- [ ] From POS or browse, navigate to checkout with cart
- [ ] Select "Wallet" payment
- [ ] Tap Pay → PIN modal appears
- [ ] Enter correct global PIN → payment processes
- [ ] Check `wallet_transactions` → buyer debit + seller credit records
- [ ] Check `shop_orders` → order created with `payment_status: 'paid'`

### Escrow
- [ ] Set `shops.settings.escrow_enabled = true`
- [ ] Place order with escrow payment method
- [ ] Check `escrow_accounts` → record with `status: 'funded'`
- [ ] Call `shopPaymentService.releaseEscrow(orderId)`
- [ ] Seller wallet credited, escrow status = 'released'

---

## DATABASE RPC FUNCTIONS NEEDED

If these RPCs don't exist, create them:

```sql
-- Decrement stock after sale
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE shop_products
  SET stock_quantity = GREATEST(0, stock_quantity - p_quantity),
      sales_count = sales_count + p_quantity
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Increment shop totals
CREATE OR REPLACE FUNCTION increment_shop_sales(p_shop_id UUID, p_amount NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE shops
  SET total_sales = total_sales + p_amount,
      total_orders = total_orders + 1
  WHERE id = p_shop_id;
END;
$$ LANGUAGE plpgsql;

-- Increment POS session sales
CREATE OR REPLACE FUNCTION increment_pos_sales(p_session_id UUID, p_amount NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE pos_sessions
  SET total_sales = total_sales + p_amount,
      total_transactions = total_transactions + 1
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;
```

---

## NEXT: PHASE 3 — DELIVERY & LOGISTICS

- Connect `shop_orders` to Boda/MTaxi dispatch
- Delivery status tracking
- Driver assignment via `delivery_agent_id`
