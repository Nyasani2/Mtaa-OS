
# MTAA AFRIQ SHOP MODULE - Installation Guide

## Files Overview (25 files total)

### 1. SQL Schema (1 file)
- `shop_module_schema.sql` - 25 tables, RLS, triggers, functions, realtime

### 2. Edge Functions (5 files)
- `shop-pos-scan.ts` - Barcode/QR scanning
- `shop-create-order.ts` - Order creation with inventory + affiliate + escrow
- `shop-escrow-release.ts` - Escrow release on delivery confirmation
- `shop-accounting-sync.ts` - P&L, Balance Sheet, Cash Flow reports
- `shop-marketplace-sync.ts` - Marketplace sync + search

### 3. Domain Layer (4 files)
- `shop_types.ts` - All TypeScript interfaces
- `shopService.ts` - Core shop operations
- `accountingService.ts` - Accounting & reporting
- `affiliateService.ts` - Affiliate program management

### 4. State & Hooks (3 files)
- `shopStore.ts` - Zustand store with cart, POS, dashboard
- `useShop.ts` - Shop, products, orders, cart, POS hooks
- `useMarketplace.ts` - Marketplace search + messaging hooks

### 5. UI Components (8 files)
- `POSScreen.tsx` - Barcode scanner, cart, checkout
- `ProductManager.tsx` - CRUD products with barcode/SKU
- `OrderManager.tsx` - Order lifecycle + escrow actions
- `ShopDashboard.tsx` - Metrics + quick actions
- `AccountingDashboard.tsx` - P&L, balance sheet, expenses
- `AffiliateManager.tsx` - Program setup + link sharing
- `MarketplaceBrowser.tsx` - Product search by category
- `CustomerChat.tsx` - Realtime buyer-seller messaging

### 6. App Routes (6 files)
- `shop_index.tsx` - Main shell with tab navigation
- `shop_create.tsx` - Shop creation wizard
- `marketplace_index.tsx` - Marketplace browser
- `product_detail.tsx` - Product page with chat + cart
- `cart_screen.tsx` - Shopping cart with escrow checkout
- `my_orders.tsx` - Customer order history

### 7. Registry (2 files)
- `shopRegistry.ts` - App manifest for kernel
- `ShopQuickAccess.tsx` - Profile screen widget

## Installation Steps

### Step 1: Run SQL
```bash
psql $DATABASE_URL -f shop_module_schema.sql
```

### Step 2: Deploy Edge Functions
```bash
supabase functions deploy shop-pos-scan
supabase functions deploy shop-create-order
supabase functions deploy shop-escrow-release
supabase functions deploy shop-accounting-sync
supabase functions deploy shop-marketplace-sync
```

### Step 3: Copy Domain Files
```bash
# Create directories
mkdir -p lib/shop/{types,services,state,hooks}
mkdir -p components/shop
mkdir -p app/(os)/shop
mkdir -p app/(os)/marketplace
mkdir -p app/(os)/shop/\[shopId\]/product

# Copy files
cp shop_types.ts lib/shop/types/
cp shopService.ts lib/shop/services/
cp accountingService.ts lib/shop/services/
cp affiliateService.ts lib/shop/services/
cp shopStore.ts lib/shop/state/
cp useShop.ts lib/shop/hooks/
cp useMarketplace.ts lib/shop/hooks/
```

### Step 4: Copy Components
```bash
cp POSScreen.tsx components/shop/
cp ProductManager.tsx components/shop/
cp OrderManager.tsx components/shop/
cp ShopDashboard.tsx components/shop/
cp AccountingDashboard.tsx components/shop/
cp AffiliateManager.tsx components/shop/
cp MarketplaceBrowser.tsx components/shop/
cp CustomerChat.tsx components/shop/
```

### Step 5: Copy Routes
```bash
cp shop_index.tsx app/(os)/shop/index.tsx
cp shop_create.tsx app/(os)/shop/create.tsx
cp marketplace_index.tsx app/(os)/marketplace/index.tsx
cp product_detail.tsx app/(os)/shop/\[shopId\]/product/\[productId\].tsx
cp cart_screen.tsx app/(os)/shop/cart.tsx
cp my_orders.tsx app/(os)/shop/my-orders.tsx
```

### Step 6: Register App
```bash
cp shopRegistry.ts lib/shop/shopRegistry.ts
# Add import to your app registry/index.ts:
import "@/lib/shop/shopRegistry";
```

### Step 7: Add Profile Widget
```bash
cp ShopQuickAccess.tsx components/profile/ShopQuickAccess.tsx
# Import in your profile screen:
import ShopQuickAccess from "@/components/profile/ShopQuickAccess";
```

## Key Features Implemented

✅ POS Terminal with barcode/QR scanning
✅ Inventory tracking with low stock alerts
✅ Purchase orders for restocking
✅ Order lifecycle management (8 statuses)
✅ Escrow-connected payments (funds held until delivery)
✅ Delivery receipt scanning triggers escrow release
✅ Full double-entry accounting (Chart of Accounts, Journal Entries, P&L, Balance Sheet)
✅ Expense tracking with auto-journal creation
✅ Affiliate marketing with percentage/fixed/tiered commissions
✅ Referral link generation and sharing
✅ Marketplace browser with category filtering
✅ Realtime customer-seller chat
✅ Profile screen quick access widget
✅ Cart with escrow checkout
✅ Order history for customers
