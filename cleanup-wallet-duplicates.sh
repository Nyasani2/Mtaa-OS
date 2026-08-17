#!/bin/bash
# Run from ~/MTAA_OS_V10
set -e

echo "=== PURGING STALE WALLET DUPLICATES ==="

# Stale hooks that were never updated by ZIPs — DELETE
rm -f lib/hooks/useWalletStore.ts
rm -f lib/hooks/useWallet.ts
rm -f lib/hooks/useAgent.ts
rm -f lib/identity/hooks/useWallet.ts

# Old backup files if any
rm -f lib/stores/wallet-store.ts.bak* 2>/dev/null || true
rm -f lib/stores/wallet-store.safe.ts 2>/dev/null || true

# Remove any leftover app/(os)/wallet/hooks duplicates (we keep the real ones)
# The real ones are: useWalletAccount.ts, useWalletTaxes.ts, index.ts
# If there are any other ghost files in there, nuke them
for f in app/\(os\)/wallet/hooks/*.ts; do
  basename=$(basename "$f")
  if [ "$basename" != "useWalletAccount.ts" ] && [ "$basename" != "useWalletTaxes.ts" ] && [ "$basename" != "index.ts" ]; then
    echo "Removing ghost hook: $f"
    rm -f "$f"
  fi
done

echo "=== CLEANING METRO / BABEL CACHE ==="
rm -rf node_modules/.cache
rm -rf .expo
watchman watch-del-all 2>/dev/null || true

echo "=== DONE ==="
echo "Next: unzip the fix package, then run: npx expo start --clear"
