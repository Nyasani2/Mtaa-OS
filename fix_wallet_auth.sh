#!/bin/bash
# Fix wallet pages: useAuthStore -> useIdentity
cd ~/MTAA_OS_V10

for f in \
  "app/(os)/wallet/qr.tsx" \
  "app/(os)/wallet/escrow.tsx" \
  "app/(os)/wallet/qr-scan.tsx" \
  "app/(os)/wallet/receive.tsx" \
  "app/(os)/wallet/banks.tsx" \
  "app/(os)/wallet/agent.tsx" \
  "app/(os)/wallet/savings-loans.tsx" \
  "app/(os)/wallet/qr-action.tsx"; do
  if [ -f "$f" ]; then
    sed -i 's/import { useAuthStore } from "@\/hooks\/useAuthStore"/import { useIdentity } from "@\/hooks\/useAuthStore"/g' "$f"
    sed -i 's/const { user } = useAuthStore()/const { user } = useIdentity()/g' "$f"
    sed -i "s/import { useAuthStore } from '@\/hooks\/useAuthStore'/import { useIdentity } from '@\/hooks\/useAuthStore'/g" "$f"
    sed -i "s/const { user } = useAuthStore()/const { user } = useIdentity()/g" "$f"
    echo "Fixed: $f"
  else
    echo "Not found: $f"
  fi
done

echo "Wallet auth fixes applied"
