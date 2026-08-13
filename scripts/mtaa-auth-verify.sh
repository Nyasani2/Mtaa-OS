#!/bin/bash
# Verify auth is unified across ALL apps

echo "=== Auth Unification Verification ==="
echo ""

echo "[1] Canonical auth exports:"
grep -n "export" lib/auth/index.ts
echo ""

echo "[2] useCurrentUser hook exists:"
test -f lib/auth/use-current-user.ts && echo "  ✓ lib/auth/use-current-user.ts" || echo "  ✗ MISSING"
echo ""

echo "[3] Broken useIdentity imports remaining:"
count=$(grep -rn "useIdentity.*auth.store" app/ lib/ components/ 2>/dev/null | wc -l)
echo "  Found: $count files"
if [ "$count" -gt 0 ]; then
  grep -rn "useIdentity.*auth.store" app/ lib/ components/ 2>/dev/null | head -10
fi
echo ""

echo "[4] Broken useAuth imports remaining:"
count=$(grep -rn "useAuth.*lib/auth"" app/ lib/ components/ 2>/dev/null | wc -l)
echo "  Found: $count files"
if [ "$count" -gt 0 ]; then
  grep -rn "useAuth.*lib/auth"" app/ lib/ components/ 2>/dev/null | head -10
fi
echo ""

echo "[5] Broken /auth/ routes remaining:"
count=$(grep -rn "'/auth/login'\|'/auth/signup'\|'/auth/forgot-password'\|'/auth/create-pin'" app/ 2>/dev/null | wc -l)
echo "  Found: $count files"
if [ "$count" -gt 0 ]; then
  grep -rn "'/auth/login'\|'/auth/signup'\|'/auth/forgot-password'\|'/auth/create-pin'" app/ 2>/dev/null | head -10
fi
echo ""

echo "[6] Apps importing auth correctly:"
echo "  useAuthStore from store:"
grep -rl "from '@/lib/auth/store/auth.store'" app/ lib/ components/ 2>/dev/null | wc -l | xargs echo "    "
echo "  useAuth from barrel:"
grep -rl "from '@/lib/auth'" app/ lib/ components/ 2>/dev/null | wc -l | xargs echo "    "
echo ""

echo "=== Verification complete ==="
