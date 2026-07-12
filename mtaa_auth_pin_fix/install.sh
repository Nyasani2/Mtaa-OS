#!/bin/bash
# MTAA OS V10 — Auth + PIN Fix Installer
# Fixes: initPromise hang, PIN key migration, 4-6 digit support

set -e

cd ~/MTAA_OS_V10

BACKUP=".backup/auth_pin_fix_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"

echo "=== BACKING UP CURRENT FILES ==="
cp "app/_layout.tsx" "$BACKUP/" 2>/dev/null || true
cp "lib/security/pin-engine.ts" "$BACKUP/" 2>/dev/null || true
cp "lib/auth/store/auth.store.ts" "$BACKUP/" 2>/dev/null || true
cp "lib/auth/use-identity.ts" "$BACKUP/" 2>/dev/null || true
cp "lib/hooks/useIdentity.ts" "$BACKUP/" 2>/dev/null || true
cp "lib/hooks/useAdmin.ts" "$BACKUP/" 2>/dev/null || true
cp "app/auth/set-pin.tsx" "$BACKUP/" 2>/dev/null || true
cp "app/(os)/lock-screen.tsx" "$BACKUP/" 2>/dev/null || true

echo "✅ Backed up to $BACKUP"

echo ""
echo "=== INSTALLING FIXES ==="

# 1. Restore _layout.tsx (no AuthGate/LockGate)
cp "mtaa_auth_pin_fix/_layout.tsx" "app/_layout.tsx"
echo "✅ app/_layout.tsx — restored to original (no gates)"

# 2. Fix pin-engine.ts (backward compatible)
cp "mtaa_auth_pin_fix/pin-engine.ts" "lib/security/pin-engine.ts"
echo "✅ lib/security/pin-engine.ts — backward compatible, 4-6 digit, legacy key migration"

# 3. Fix auth.store.ts (no initPromise race guard)
cp "mtaa_auth_pin_fix/auth.store.ts" "lib/auth/store/auth.store.ts"
echo "✅ lib/auth/store/auth.store.ts — emailRedirectTo, listener cleanup, profile auto-create, NO race guard"

# 4. Fix use-identity.ts
cp "mtaa_auth_pin_fix/use-identity.ts" "lib/auth/use-identity.ts"
echo "✅ lib/auth/use-identity.ts — canonical store"

# 5. Fix hooks/useIdentity.ts
cp "mtaa_auth_pin_fix/hooks-useIdentity.ts" "lib/hooks/useIdentity.ts"
echo "✅ lib/hooks/useIdentity.ts — canonical store"

# 6. Fix hooks/useAdmin.ts
cp "mtaa_auth_pin_fix/hooks-useAdmin.ts" "lib/hooks/useAdmin.ts"
echo "✅ lib/hooks/useAdmin.ts — correct import path"

# 7. Fix set-pin.tsx
cp "mtaa_auth_pin_fix/set-pin.tsx" "app/auth/set-pin.tsx"
echo "✅ app/auth/set-pin.tsx — 4-6 digit PIN creation"

# 8. Fix lock-screen.tsx
cp "mtaa_auth_pin_fix/lock-screen.tsx" "app/(os)/lock-screen.tsx"
echo "✅ app/(os)/lock-screen.tsx — 4-6 digit PIN entry, forgot PIN works"

echo ""
echo "=== CLEANING UP BROKEN FILES ==="
rm -f "lib/stores/auth-store.ts" 2>/dev/null || true
rm -f "lib/auth/state/auth.store.ts.bak.*" 2>/dev/null || true
rm -f "lib/stores/auth-store.ts.bak.*" 2>/dev/null || true
rm -f "lib_auth_identity.ts" 2>/dev/null || true
rm -f "lib_auth_os-gate.ts" 2>/dev/null || true
rm -f "lib_auth_use-identity.ts" 2>/dev/null || true
rm -f "lib_kernel_auth_useAuthStore.ts" 2>/dev/null || true
rm -f "lib_security_pin-engine.ts" 2>/dev/null || true
rm -f "lib/kernel/stores/authStore.ts.bak.*" 2>/dev/null || true

echo "✅ Cleaned up orphaned/duplicate files"

echo ""
echo "=== INSTALL COMPLETE ==="
echo "Run: npx expo start --clear"
