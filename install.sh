#!/bin/bash
cd ~/MTAA_OS_V10

# Copy fixed files
cp mtaa_fix_round2/lib_auth_identity.ts lib/auth/identity.ts
cp mtaa_fix_round2/lib_mtruck_stores_useShipperStore.ts lib/mtruck/stores/useShipperStore.ts
cp mtaa_fix_round2/lib_auth_os-gate.ts lib/auth/os-gate.ts
cp mtaa_fix_round2/lib_mtaa_appstore_unified-registry.ts lib/mtaa/appstore/unified-registry.ts
cp mtaa_fix_round2/hooks_useAppStore.ts hooks/useAppStore.ts
cp mtaa_fix_round2/hooks_useAdmin.ts hooks/useAdmin.ts
cp mtaa_fix_round2/lib_integrations_rails_railRegistry.ts lib/integrations/rails/railRegistry.ts
cp mtaa_fix_round2/lib_marketplace_services_cart.service.ts lib/marketplace/services/cart.service.ts
cp mtaa_fix_round2/lib_wallet_services_withdraw.service.ts lib/wallet/services/withdraw.service.ts

for comp in ScreenshotCarousel AsisChat AppReviews InstallProgress AppStoreHeader FeaturedBanner AppCard CategoryPill BottomNav; do
    cp mtaa_fix_round2/components_appstore_${comp}.tsx components/appstore/${comp}.tsx
done

# Fix marketplace paths (if not already done)
sed -i 's|"/(os)/marketplace"|"/(marketplace)"|g' "app/(marketplace)/cart.tsx"
sed -i 's|"/(os)/marketplace/checkout"|"/(marketplace)/checkout"|g' "app/(marketplace)/cart.tsx"
sed -i 's|"/(os)/wallet/kyc"|"/(wallet)/kyc"|g' "app/(marketplace)/checkout.tsx"
sed -i 's|"/(os)/marketplace/order-success"|"/(marketplace)/order-success"|g' "app/(marketplace)/checkout.tsx"
sed -i 's|"/(os)/marketplace/orders"|"/(marketplace)/orders"|g' "app/(marketplace)/order-success.tsx"
sed -i 's|"/(os)/marketplace"|"/(marketplace)"|g' "app/(marketplace)/order-success.tsx"

echo "=== Running TypeScript check ==="
npx tsc --noEmit 2>&1 | grep -v "^node_modules" | head -50
ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
echo ""
echo "=== Error count: $ERROR_COUNT ==="
