#!/bin/bash
# MTAA Auth Cleanup Script — Phase 0
# Run this AFTER applying the Phase 1 ZIP to remove duplicate/stub auth files

echo "=== MTAA Auth Cleanup ==="

cd "$(dirname "$0")"

# Remove old standalone auth files (replaced by new canonical versions)
OLD_AUTH_FILES=(
  "app/auth/set-pin.tsx"
  "app/auth/forgot-pin.tsx"
  "app/settings/blocked.tsx"
)

for f in "${OLD_AUTH_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "Removing duplicate: $f"
    rm "$f"
  else
    echo "Already gone: $f"
  fi
done

# Remove old wallet PIN create if it exists (consolidated into settings/pin.tsx)
if [ -f "app/(os)/wallet/onboarding/pin-create.tsx" ]; then
  echo "Note: app/(os)/wallet/onboarding/pin-create.tsx still exists"
  echo "  → PIN creation is now handled by settings/pin.tsx"
  echo "  → You may delete pin-create.tsx if wallet no longer references it"
fi

# Remove old settings change-pin if it exists (consolidated into settings/pin.tsx)
if [ -f "app/(os)/settings/change-pin.tsx" ]; then
  echo "Removing duplicate: app/(os)/settings/change-pin.tsx"
  rm "app/(os)/settings/change-pin.tsx"
fi

echo "=== Cleanup complete ==="
echo ""
echo "Next steps:"
echo "1. Ensure app/(auth)/_layout.tsx registers login, signup, forgot-password, verify-email"
echo "2. Ensure app/_layout.tsx calls useAuthStore.getState().initialize() on boot"
echo "3. Rebuild and test login → signup → verify → profile flow"
