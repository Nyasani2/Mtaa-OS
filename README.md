# Shop Management Flow — Dashboard + Add Product + Product List

## What You Get
1. **Shop Dashboard** (`app/(commerce)/shop/[id].tsx`)
   - Cover photo, logo, shop info
   - Stats: orders, sales, rating, product count
   - Quick actions: Add Product, All Products, Orders, Settings
   - Recent products list

2. **Add Product** (`app/(commerce)/shop/[id]/products/add.tsx`)
   - Photo upload (web file picker, native coming)
   - Name, category, price, stock quantity
   - Barcode / SKU field with scan button placeholder
   - Description
   - Success → option to add another or view shop

3. **Product List** (`app/(commerce)/shop/[id]/products/index.tsx`)
   - All products in the shop
   - Image, name, price, stock, barcode, status
   - Pull to refresh
   - Empty state with "Add First Product" button

## Installation
```bash
cd ~/MTAA_OS_V10
unzip -o ~/Downloads/shop-management-flow.zip -d .
rm -rf node_modules/.cache .expo
npx expo start --clear
```

## Important — Check Your Product Table Name
The code uses `shop_products`. If your table has a different name, change it in:
- `app/(commerce)/shop/[id].tsx` (line with `.from('shop_products')`)
- `app/(commerce)/shop/[id]/products/add.tsx` (line with `.from('shop_products')`)
- `app/(commerce)/shop/[id]/products/index.tsx` (line with `.from('shop_products')`)

Run this SQL to check your actual product table name:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%product%';
```

## Storage Bucket
Product photos upload to Supabase Storage bucket `shop-products`.
Run this in Supabase SQL Editor to create it:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-products', 'shop-products', true)
ON CONFLICT (id) DO NOTHING;
```

## Test Flow
1. Create a shop → should navigate to dashboard automatically
2. Tap "Add Product" → fill form → add photos → submit
3. See product in dashboard "Recent Products" section
4. Tap "All Products" → see full product list
