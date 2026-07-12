#!/bin/bash
# MTAA OS V10 — PIN System v3
# Fixes: 6-digit PIN support, proper migration, persistence, post-login setup

set -e

cd ~/MTAA_OS_V10

BACKUP=".backup/pin_system_v3_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"

echo "=== BACKING UP ==="
cp "lib/security/pin-engine.ts" "$BACKUP/" 2>/dev/null || true
cp "app/auth/set-pin.tsx" "$BACKUP/" 2>/dev/null || true
cp "app/(os)/lock-screen.tsx" "$BACKUP/" 2>/dev/null || true

echo "✅ Backed up to $BACKUP"

echo ""
echo "=== INSTALLING ==="

cp "mtaa_pin_system_v3/pin-engine.ts" "lib/security/pin-engine.ts"
echo "✅ pin-engine.ts — 4-6 digit, legacy migration, robust storage"

cp "mtaa_pin_system_v3/set-pin.tsx" "app/auth/set-pin.tsx"
echo "✅ set-pin.tsx — 4-6 digit creation, skip option"

cp "mtaa_pin_system_v3/lock-screen.tsx" "app/(os)/lock-screen.tsx"
echo "✅ lock-screen.tsx — 4-6 digit entry, forgot PIN works"

cp "mtaa_pin_system_v3/pin-setup-guard.tsx" "lib/components/pin-setup-guard.tsx"
echo "✅ pin-setup-guard.tsx — optional post-login PIN prompt"

echo ""
echo "=== INSTALL COMPLETE ==="
echo ""
echo "To enable post-login PIN prompt, add this to your OS home screen:"
echo "  import { usePinSetupGuard } from '@/lib/components/pin-setup-guard';"
echo "  usePinSetupGuard();"
echo ""
echo "Run: npx expo start --web --clear"
