#!/bin/bash
# ============================================================
# MTAA OS V10 — Wallet Route Fix Script
# Fixes all broken router.push paths in wallet screens
# Run from ~/MTAA_OS_V10
# ============================================================

echo "=== Fixing Wallet Routes ==="

# Use single quotes for sed patterns to avoid shell expansion issues
# Escape parentheses properly for sed

# wallet/index.tsx
sed -i "s|router.push('/auth/sign-in')|router.push('/(os)/auth/sign-in')|g" "app/(os)/wallet/index.tsx"

# wallet/advance/index.tsx
sed -i "s|router.push('/wallet/advance/request')|router.push('/(os)/wallet/advance/request')|g" "app/(os)/wallet/advance/index.tsx"

# wallet/government-hub.tsx
sed -i "s|router.push('/wallet/gov-portal')|router.push('/(os)/wallet/gov-portal')|g" "app/(os)/wallet/government-hub.tsx"

# wallet/claim.tsx
sed -i "s|router.push('/wallet/support')|router.push('/(os)/wallet/support')|g" "app/(os)/wallet/claim.tsx"

# wallet/escrow.tsx
sed -i "s|router.push(\`/wallet/qr|router.push(\`/(os)/wallet/qr|g" "app/(os)/wallet/escrow.tsx"

# wallet/credit/index.tsx
sed -i "s|router.push('/wallet/advance')|router.push('/(os)/wallet/advance')|g" "app/(os)/wallet/credit/index.tsx"

# wallet/profile.tsx
sed -i "s|router.push('/wallet/settings')|router.push('/(os)/wallet/settings')|g" "app/(os)/wallet/profile.tsx"
sed -i "s|router.push('/wallet/send')|router.push('/(os)/wallet/send')|g" "app/(os)/wallet/profile.tsx"
sed -i "s|router.push('/wallet/receive')|router.push('/(os)/wallet/receive')|g" "app/(os)/wallet/profile.tsx"
sed -i "s|router.push('/wallet/qr')|router.push('/(os)/wallet/qr')|g" "app/(os)/wallet/profile.tsx"

# wallet/merchant-dashboard.tsx — these are already correct in your file, but double-check
sed -i 's|router.push("/wallet/merchant-analytics")|router.push("/(os)/wallet/merchant-analytics")|g' "app/(os)/wallet/merchant-dashboard.tsx"
sed -i 's|router.push("/wallet/merchant-customers")|router.push("/(os)/wallet/merchant-customers")|g' "app/(os)/wallet/merchant-dashboard.tsx"

echo "=== Route fixes applied ==="
echo ""
echo "=== Verification ==="
grep -n "router.push" "app/(os)/wallet/index.tsx" | head -3
grep -n "router.push" "app/(os)/wallet/profile.tsx" | head -3
grep -n "router.push" "app/(os)/wallet/escrow.tsx" | head -3
grep -n "router.push" "app/(os)/wallet/merchant-dashboard.tsx" | head -3
