# MTAA SHOP — PRODUCTION AUDIT REPORT
## Generated: 2026-08-16 | Scope: Shop Module Critical Path

---

## EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| **Shop Create Button** | 🔴 **BROKEN — Schema mismatch causes silent Supabase rejection** |
| **Merchant Dashboard** | 🔴 **BROKEN — Queries non-existent `business_profiles` table** |
| **Merchant Analytics** | 🔴 **BROKEN — Uses `Math.random()` fake data** |
| **Duplicate Architecture** | 🔴 **3 parallel shop systems (`domains/shop/`, `lib/shop/`, `lib/services/shop-service.ts`)** |
| **Schema/Frontend Alignment** | 🔴 **Multiple column name mismatches (`type`≠`category`, `verified`≠`verification_status`, `status:'open'`≠enum)** |
| **Shop QR Generation** | 🔴 **MISSING — No QR table, no deterministic generation** |
| **Shop Wallet Connection** | 🔴 **MISSING — No shop wallet table; `wallet_accounts` has no `shop_id` FK** |
| **Product Boost/Ads** | 🔴 **MISSING — No campaign tables, no boost UI wiring** |
| **Delivery Integration** | 🔴 **MISSING — No Boda/MTaxi connection in order flow** |
| **ASIS Integration** | 🔴 **MISSING — No shop-aware ASIS endpoints** |
| **RLS Policies** | ⚠️ **UNKNOWN — Not audited; shop creation bypasses RLS if `shops` table has no insert policy** |
| **Edge Functions** | ⚠️ **NONE — No shop/merchant edge functions deployed** |

---

## ROOT CAUSE: WHY THE "CREATE BUSINESS" BUTTON IS DEAD

The `handleCreate()` in `app/(commerce)/shop/create.tsx` fires, but the Supabase `.insert()` fails with a **schema violation**. The error is caught by the try/catch and passed to `Alert.alert()`, which may not render visibly on web. The user sees **zero feedback** — the button appears dead.

### Exact Schema Violations in Current Code:

| Code Inserts | Schema Requires | Violation |
|---|---|---|
| `type: 'retail'` | `category TEXT NOT NULL` | Column `type` does **not exist** |
| `verified: false` | `verification_status TEXT DEFAULT 'unverified'` | Column `verified` does **not exist** |
| `status: 'open'` | `status CHECK ('pending','active','suspended','closed')` | `'open'` is **not in enum** |
| *(missing)* | `slug TEXT UNIQUE NOT NULL` | **Required field missing** |
| `shop_staff.status: 'active'` | `shop_staff.is_active BOOLEAN DEFAULT true` | Column `status` does **not exist** |
| *(missing)* | `shop_staff.name TEXT NOT NULL` | **Required field missing** |

**Result**: 6 separate schema violations = guaranteed insert failure = dead button.

---

## ARCHITECTURE DRIFT ANALYSIS

### Three Parallel Shop Systems Detected

```
┌─────────────────────────────────────────────────────────────┐
│  PATH                          │  PATTERN    │  STATE       │
├─────────────────────────────────────────────────────────────┤
│  domains/shop/                 │  v2 DDD     │  MOST COMPLETE│
│  ├── services/shopService.ts   │  Class-based│  Has CRUD    │
│  ├── hooks/useShop.ts          │  Custom hooks│  OK-ish     │
│  ├── state/shopStore.ts        │  Zustand    │  OK          │
│  └── types/shop_types.ts       │  Rich types │  COMPLETE    │
├─────────────────────────────────────────────────────────────┤
│  lib/shop/                     │  Legacy     │  MINIMAL     │
│  ├── services/shopService.ts   │  Static class│  Only .list()│
│  ├── hooks/useShop.ts          │  TanStack   │  ALL call .list()│
│  └── state/shopStore.ts        │  Zustand    │  POS-only    │
├─────────────────────────────────────────────────────────────┤
│  lib/services/shop-service.ts  │  Minimal    │  2 functions │
│  └── getShopItems, createShopOrder                         │
├─────────────────────────────────────────────────────────────┤
│  app/(commerce)/shop/create.tsx│  UI Screen  │  BYPASSES ALL│
│  └── Direct supabase call — no service, no validation      │
└─────────────────────────────────────────────────────────────┘
```

**Canonical Path**: `domains/shop/` is the richest implementation and should be the single source of truth.

### Merchant Screens Use Wrong Tables

`app/(os)/wallet/merchant-dashboard.tsx` queries:
- `business_profiles` ← **Table does not exist in shop schema**
- `business_transactions` ← **Table does not exist in shop schema**

These should query:
- `shops` (for business data)
- `shop_orders` (for transactions)
- `wallet_transactions` (for wallet movements)

### Analytics Screen Contains Fake Data

```ts
// merchant-analytics.tsx — CURRENT (FAKE)
const stats: DailyStat[] = days.map((day) => ({
  day,
  revenue: Math.floor(Math.random() * 50000) + 5000,  // ← FAKE
  transactions: Math.floor(Math.random() * 30) + 5,   // ← FAKE
}));

// Mock top products (replace with real query when products table exists)
setTopProducts([
  { name: 'Product A', sales: 45, revenue: 22500 },   // ← FAKE
  ...
]);
```

---

## DATABASE INTEGRITY CHECK

### Tables That Exist (from schema dump):
- `shops` ✅
- `shop_staff` ✅
- `shop_categories` ✅
- `shop_products` ✅
- `inventory_transactions` ✅
- `purchase_orders` / `purchase_order_items` ✅
- `pos_sessions` ✅
- `shop_orders` / `shop_order_items` ✅
- `shop_accounts` / `shop_journal_entries` / `shop_journal_lines` ✅
- `shop_expenses` ✅
- `shop_affiliate_programs` / `shop_affiliates` / `shop_affiliate_conversions` ✅

### Tables That Are MISSING (per spec requirements):
- `shop_qr_codes` ← For deterministic QR storage
- `shop_wallet_accounts` ← For merchant wallet balance
- `shop_ad_campaigns` ← For product boost/advertising
- `shop_ad_impressions` ← For ad analytics
- `shop_delivery_assignments` ← For Boda/MTaxi integration
- `shop_content_posts` ← For social commerce (Streets integration)

### Schema/Type Mismatches:
| Type File | Field | Schema Says | Type File Says |
|---|---|---|---|
| `domains/shop/services/shopService.ts` | `Shop.status` | `'pending'|'active'|'suspended'|'closed'` | `'active'|'inactive'|'suspended'` |
| `domains/shop/services/shopService.ts` | `Shop` | 25+ fields | 9 fields (incomplete) |
| `lib/shop/services/shopService.ts` | `ShopService` | Class with methods | Static class, only `.list()` |

---

## SECURITY AUDIT

| Check | Status | Notes |
|---|---|---|
| RLS on `shops` | ⚠️ UNKNOWN | Not inspected — if missing, any authenticated user can read all shops |
| RLS on `shop_staff` | ⚠️ UNKNOWN | Not inspected |
| RLS on `shop_orders` | ⚠️ UNKNOWN | Not inspected |
| Shop ownership validation | ⚠️ PARTIAL | Frontend checks `owner_id`, but no backend enforcement visible |
| Payment authorization | 🔴 MISSING | No PIN/biometric gate on shop payments |
| Campaign spend authorization | 🔴 MISSING | No wallet authorization on boost creation |

---

## REPAIR PLAN — PHASED

### Phase 1: CRITICAL PATH (This Delivery)
1. ✅ Fix `app/(commerce)/shop/create.tsx` — align with schema, add slug/QR generation
2. ✅ Fix `domains/shop/services/shopService.ts` — add `createShop`, `updateShop`, `addShopStaff`
3. ✅ Fix `domains/shop/hooks/useShop.ts` — remove broken `ShopService.list()` for everything
4. ✅ Fix `app/(os)/wallet/merchant-dashboard.tsx` — query `shops`/`shop_orders`, remove fake data
5. ✅ Fix `app/(os)/wallet/merchant-analytics.tsx` — query real tables, remove `Math.random()`

### Phase 2: WALLET & PAYMENT (Next)
6. Connect shop creation to `wallet_accounts` (add `shop_id` support or create `shop_wallet_accounts`)
7. Wire checkout flow to `wallet_transactions` with PIN/biometric auth
8. Build shop QR payment resolver

### Phase 3: DELIVERY & LOGISTICS (Next)
9. Connect `shop_orders` to Boda/MTaxi dispatch system
10. Build delivery status tracking UI

### Phase 4: ADVERTISING & BOOST (Next)
11. Create `shop_ad_campaigns` table + edge function
12. Wire "Boost Product" button to real campaign creation
13. Build geographic targeting in campaign creation

### Phase 5: SOCIAL COMMERCE & ASIS (Next)
14. Connect shop products to Streets content tagging
15. Build ASIS shop-aware context endpoints

---

## FILES DELIVERED IN THIS PACKAGE

| File | Target Path | Change |
|---|---|---|
| `shop-create-fix.tsx` | `app/(commerce)/shop/create.tsx` | Schema-aligned, slug/QR gen, proper auth |
| `shopService.ts` | `domains/shop/services/shopService.ts` | Added `createShop`, `updateShop`, `addShopStaff`, fixed `Shop` interface |
| `useShop.ts` | `domains/shop/hooks/useShop.ts` | Fixed imports, removed broken `ShopService.list()` fallback |
| `merchant-dashboard.tsx` | `app/(os)/wallet/merchant-dashboard.tsx` | Real `shops`/`shop_orders` queries, no fake data |
| `merchant-analytics.tsx` | `app/(os)/wallet/merchant-analytics.tsx` | Real analytics queries, no `Math.random()` |

---

## INSTALLATION INSTRUCTIONS

```bash
cd ~/MTAA_OS_V10

# Backup existing files first
cp app/\(commerce\)/shop/create.tsx app/\(commerce\)/shop/create.tsx.bak
cp domains/shop/services/shopService.ts domains/shop/services/shopService.ts.bak
cp domains/shop/hooks/useShop.ts domains/shop/hooks/useShop.ts.bak
cp app/\(os\)/wallet/merchant-dashboard.tsx app/\(os\)/wallet/merchant-dashboard.tsx.bak
cp app/\(os\)/wallet/merchant-analytics.tsx app/\(os\)/wallet/merchant-analytics.tsx.bak

# Extract the fix
unzip -o ~/Downloads/shop-critical-fix-v1.zip -d .

# Clear caches
rm -rf node_modules/.cache .expo
watchman watch-del-all 2>/dev/null || true

# Restart
npx expo start --clear
```

---

## VERIFICATION CHECKLIST

After installing, test these journeys:

- [ ] Open `/shop/create`, fill form, click "Create Business" → should navigate to shop dashboard
- [ ] Check `shops` table in Supabase → new row with `slug`, `category`, `verification_status: 'unverified'`
- [ ] Check `shop_staff` table → owner row with `role: 'owner'`, `is_active: true`
- [ ] Open merchant dashboard → shows real shop data, not placeholders
- [ ] Open merchant analytics → shows real order counts and revenue, not random numbers
- [ ] Verify no `business_profiles` or `business_transactions` queries remain

---

*Report generated per MTAA OS V10 Production Audit Specification (36 sections).*
*Preserve-first protocol observed. No files deleted. No greenfield rewrites.*
