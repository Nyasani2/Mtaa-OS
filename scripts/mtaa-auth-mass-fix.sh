#!/bin/bash
# MTAA Auth Mass Fix — Fixes ALL broken auth imports across the entire codebase
# Run from ~/MTAA_OS_V10

echo "=== MTAA Auth Unification Fix ==="
echo ""

# ── 1. Fix useIdentity imported from wrong path ──
echo "[1/5] Fixing useIdentity imports from auth.store..."
find app lib components -name "*.tsx" -o -name "*.ts" | while read f; do
  if grep -q 'import.*useIdentity.*from.*auth.store' "$f" 2>/dev/null; then
    sed -i 's|import.*useIdentity.*from.*auth.store.*|import { useIdentity } from "@/lib/auth";|g' "$f"
    echo "  Fixed: $f"
  fi
done

# ── 2. Fix useAuth imported from wrong path ──
echo ""
echo "[2/5] Fixing useAuth imports..."
find app lib components -name "*.tsx" -o -name "*.ts" | while read f; do
  if grep -q "import { useAuth } from '@/lib/auth';" "$f" 2>/dev/null; then
    sed -i "s|import { useAuth } from '@/lib/auth';|import { useAuthStore } from '@/lib/auth/store/auth.store';|g" "$f"
    # Also fix the destructuring
    sed -i 's/const { user } = useAuth();/const { user } = useAuthStore();/g' "$f"
    echo "  Fixed: $f"
  fi
done

# ── 3. Fix router.replace('/auth/login') → '/login' ──
echo ""
echo "[3/5] Fixing /auth/ prefixed routes..."
find app -name "*.tsx" -o -name "*.ts" | while read f; do
  sed -i "s|'/auth/login'|'/login'|g" "$f"
  sed -i "s|'/auth/signup'|'/signup'|g" "$f"
  sed -i "s|'/auth/forgot-password'|'/forgot-password'|g" "$f"
  sed -i "s|'/auth/create-pin'|'/create-pin'|g" "$f"
  sed -i "s|'/auth/verify-email'|'/verify-email'|g" "$f"
  sed -i "s|router.replace('/auth')|router.replace('/login')|g" "$f"
done
echo "  Done."

# ── 4. Fix profile index.tsx sign out route ──
echo ""
echo "[4/5] Fixing Profile sign out..."
sed -i "s|router.replace('/auth/login')|router.replace('/login')|g" "app/(os)/profile/index.tsx"
echo "  Done."

# ── 5. Fix settings profile.tsx sign out route ──
echo ""
echo "[5/5] Fixing Settings sign out..."
sed -i "s|router.replace('/auth')|router.replace('/login')|g" "app/(os)/settings/profile.tsx"
echo "  Done."

echo ""
echo "=== Auth unification complete ==="
echo ""
echo "Verifying no broken imports remain..."
grep -rn "useIdentity.*auth.store" app/ lib/ components/ 2>/dev/null | head -5 || echo "  ✓ No broken useIdentity imports"
grep -rn "useAuth.*lib/auth"" app/ lib/ components/ 2>/dev/null | head -5 || echo "  ✓ No broken useAuth imports"
grep -rn "router.replace('/auth/login')" app/ 2>/dev/null | head -5 || echo "  ✓ No /auth/login routes"
