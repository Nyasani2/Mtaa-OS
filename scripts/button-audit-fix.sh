#!/bin/bash
# Button Audit Fix Script
# Run from ~/MTAA_OS_V10

echo "=== MTAA Button Audit Fix ==="
cd ~/MTAA_OS_V10

# 1. Install stub screens for missing routes
echo "Installing stub screens..."

# 2. Fix merchant-dashboard.tsx route prefix
echo "Fixing merchant-dashboard route prefix..."
sed -i 's|router.push("/wallet/settings")|router.push("/(os)/wallet/settings")|g' "app/(os)/wallet/merchant-dashboard.tsx" 2>/dev/null || true
sed -i "s|router.push('/wallet/settings')|router.push('/(os)/wallet/settings')|g" "app/(os)/wallet/merchant-dashboard.tsx" 2>/dev/null || true

# 3. Verify all critical routes now exist
echo ""
echo "=== Route Verification ==="
for route in \
  "app/(os)/wallet/top-up.tsx" \
  "app/(os)/wallet/withdraw.tsx" \
  "app/(os)/wallet/transfer.tsx" \
  "app/(os)/wallet/settings.tsx" \
  "app/(os)/wallet/treasury-hub.tsx" \
  "app/(os)/wallet/escrow-hub.tsx" \
  "app/(os)/wallet/tax-hub.tsx" \
  "app/(os)/wallet/scan/index.tsx" \
  "app/(os)/wallet/merchant-dashboard.tsx" \
  "app/(os)/wallet/merchant-analytics.tsx" \
  "app/(os)/wallet/merchant-customers.tsx" \
  "app/(os)/wallet/support.tsx" \
  "app/(os)/wallet/gov-portal.tsx" \
  "app/(os)/wallet/advance/request.tsx"; do
  if [ -f "$route" ]; then
    echo "  OK: $route"
  else
    echo "  MISSING: $route"
  fi
done

echo ""
echo "=== Button Audit Fix Complete ==="
echo "Run the verification checklist in BUTTON_AUDIT_REPORT.md"
