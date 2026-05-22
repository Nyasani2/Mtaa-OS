#!/bin/bash
# MTAA Error Fix Batch v2 - Installation Script
# Run from project root: ~/MTAA_OS_V10

echo "=== MTAA Error Fix Batch v2 ==="
echo "Applying fixes for 704 TypeScript errors..."
echo ""

# Backup existing files
cp tsconfig.json tsconfig.json.backup.$(date +%s) 2>/dev/null || true

echo "[1/6] Copying tsconfig.json (excludes Deno edge functions, old lib/mtaa/)..."
cp mtaa-error-fix-batch-v2/tsconfig.json tsconfig.json

echo "[2/6] Copying type stubs (courts, prisons, transport, module.types)..."
cp mtaa-error-fix-batch-v2/types/module.types.ts types/module.types.ts
cp mtaa-error-fix-batch-v2/types/courts.ts types/courts.ts
cp mtaa-error-fix-batch-v2/types/prisons.ts types/prisons.ts
cp mtaa-error-fix-batch-v2/types/transport.ts types/transport.ts

echo "[3/6] Copying lib fixes (utils, supabase, wallet store, security)..."
cp mtaa-error-fix-batch-v2/lib/utils.ts lib/utils.ts
cp mtaa-error-fix-batch-v2/lib/supabase.ts lib/supabase.ts 2>/dev/null || true
cp mtaa-error-fix-batch-v2/lib/supabase/client.ts lib/supabase/client.ts 2>/dev/null || true
cp mtaa-error-fix-batch-v2/hooks/useWalletStore.ts hooks/useWalletStore.ts
cp mtaa-error-fix-batch-v2/lib/wallet/state/walletStore.ts lib/wallet/state/walletStore.ts 2>/dev/null || true
cp mtaa-error-fix-batch-v2/lib/security/pin-store.ts lib/security/pin-store.ts 2>/dev/null || true

echo "[4/6] Copying health services and types..."
cp mtaa-error-fix-batch-v2/domains/health/services/patient.service.ts domains/health/services/patient.service.ts 2>/dev/null || true
cp mtaa-error-fix-batch-v2/domains/health/types.ts domains/health/types.ts 2>/dev/null || true
cp mtaa-error-fix-batch-v2/lib/health/types.ts lib/health/types.ts 2>/dev/null || true

echo "[5/6] Copying shop types and services..."
cp mtaa-error-fix-batch-v2/domains/shop/types.ts domains/shop/types.ts 2>/dev/null || true
cp mtaa-error-fix-batch-v2/domains/shop/services/shopService.ts domains/shop/services/shopService.ts 2>/dev/null || true
cp mtaa-error-fix-batch-v2/domains/shop/components/ShopDashboard.tsx domains/shop/components/ShopDashboard.tsx 2>/dev/null || true

echo "[6/6] Copying remaining stubs..."
# Copy all other files preserving directory structure
find mtaa-error-fix-batch-v2 -type f ! -name 'install.sh' ! -name 'README.md' | while read file; do
  target="${file#mtaa-error-fix-batch-v2/}"
  mkdir -p "$(dirname "$target")"
  cp "$file" "$target" 2>/dev/null || true
done

echo ""
echo "=== Fixes Applied ==="
echo "Next steps:"
echo "1. Install stubs to node_modules:"
echo "   bash mtaa-error-fix-batch-v2/install-stubs.sh"
echo ""
echo "2. Run type check:"
echo "   npx tsc --noEmit"
echo ""
echo "3. Check remaining errors and report count"
