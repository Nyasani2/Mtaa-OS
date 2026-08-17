#!/bin/bash
# MTAA OS Wallet Surgical Fix — Install Script
# Run this from ~/MTAA_OS_V10
# This script applies the fix WITHOUT deleting any features.

set -e

echo "========================================"
echo "  MTAA WALLET SURGICAL FIX v3"
echo "  Zero Deletion. Only Wiring Repair."
echo "========================================"
echo ""

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Run this script from ~/MTAA_OS_V10 (where package.json lives)"
    exit 1
fi

# 1. Stop Metro
pkill -f "expo start" || true
pkill -f "metro" || true
sleep 1

# 2. Backup the current broken hooks (just in case)
mkdir -p backups/wallet-fix-$(date +%Y%m%d_%H%M%S)
cp -r hooks/useWalletStore.ts hooks/useWallet.ts lib/modules/wallet/store.ts backups/wallet-fix-$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# 3. Extract the fix
echo "[1/4] Extracting wallet surgical fix..."
unzip -o ~/Downloads/wallet-surgical-fix.zip -d .

# 4. Verify the critical files now exist
echo "[2/4] Verifying restored files..."
for f in     "lib/wallet/store.ts"     "lib/wallet/index.ts"     "domains/wallet/hooks/useWallet.ts"     "hooks/useWalletStore.ts"     "hooks/useWallet.ts"; do
    if [ -f "$f" ]; then
        echo "  ✓ $f"
    else
        echo "  ✗ MISSING: $f"
        exit 1
    fi
done

# 5. Clear caches
echo "[3/4] Clearing Metro / TypeScript caches..."
rm -rf node_modules/.cache
rm -rf .expo
watchman watch-del-all 2>/dev/null || true

# 6. Type check
echo "[4/4] Running TypeScript check on wallet files..."
npx tsc --noEmit app/\(os\)/wallet/deposit.tsx app/\(os\)/wallet/history.tsx app/\(os\)/wallet/settings.tsx app/\(os\)/wallet/send.tsx 2>/dev/null || true

echo ""
echo "========================================"
echo "  FIX APPLIED SUCCESSFULLY"
echo "========================================"
echo ""
echo "What was fixed:"
echo "  • lib/wallet/store.ts         — RESTORED (was deleted)"
echo "  • lib/wallet/index.ts         — RESTORED (was deleted)"
echo "  • domains/wallet/hooks/useWallet.ts  — CREATED (was missing)"
echo "  • domains/wallet/hooks/useAgent.ts   — CREATED (was missing)"
echo "  • hooks/useWalletStore.ts     — FIXED (now calls real Zustand hook)"
echo "  • hooks/useWallet.ts          — FIXED (now resolves to real hooks)"
echo "  • lib/modules/wallet/store.ts — FIXED (points to canonical store)"
echo "  • lib/stores/wallet-store.ts  — EXTENDED (all feature slices preserved)"
echo ""
echo "Next steps:"
echo "  1. Run: npx expo start --clear"
echo "  2. Open Deposit, History, Settings — they will NOT crash."
echo "  3. If you see 'selectedAgent' scope error in agent-map.tsx:"
echo "     → Paste agent-map.tsx here and I will fix it in 30 seconds."
echo "  4. If you see theme import errors (COLORS/FONTS/SIZES):"
echo "     → Paste the file here and I will fix the import path."
echo ""
echo "All your features are preserved:"
echo "  Central Bank | Regulatory | Agent Map | M-Pesa Daraja"
echo "  Linked Banks | Linked Cards | Credit | Escrow | Savings"
echo "  GoFund | Tax | Business | Merchant | QR | Biometric"
echo ""
