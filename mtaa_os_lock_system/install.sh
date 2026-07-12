#!/bin/bash
# MTAA OS V10 — Full Lock System Installer

cd ~/MTAA_OS_V10

echo "=== BACKING UP ==="
BACKUP=".backup/lock_system_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
cp -r lib/auth "$BACKUP/" 2>/dev/null
cp -r lib/hooks "$BACKUP/" 2>/dev/null
cp -r lib/security "$BACKUP/" 2>/dev/null
cp -r lib/shell "$BACKUP/" 2>/dev/null
cp app/_layout.tsx "$BACKUP/" 2>/dev/null
cp app/auth/set-pin.tsx "$BACKUP/" 2>/dev/null
cp app/(os)/lock-screen.tsx "$BACKUP/" 2>/dev/null
echo "✅ Backed up to $BACKUP"

echo ""
echo "=== INSTALLING ==="
mkdir -p lib/auth/store
mkdir -p lib/hooks
mkdir -p lib/security
mkdir -p lib/shell
mkdir -p app/auth
mkdir -p app/\(os\)

cp mtaa_os_lock_system/auth.store.ts lib/auth/store/auth.store.ts
cp mtaa_os_lock_system/use-identity.ts lib/auth/use-identity.ts
cp mtaa_os_lock_system/auth-useAuth.ts lib/auth/useAuth.ts
cp mtaa_os_lock_system/auth-index.ts lib/auth/index.ts
cp mtaa_os_lock_system/pin-engine.ts lib/security/pin-engine.ts
cp mtaa_os_lock_system/hooks-useAuth.ts lib/hooks/useAuth.ts
cp mtaa_os_lock_system/hooks-useIdentity.ts lib/hooks/useIdentity.ts
cp mtaa_os_lock_system/hooks-useAdmin.ts lib/hooks/useAdmin.ts
cp mtaa_os_lock_system/hooks-index.ts lib/hooks/index.ts
cp mtaa_os_lock_system/os-shell-provider.tsx lib/shell/os-shell-provider.tsx
cp mtaa_os_lock_system/_layout.tsx app/_layout.tsx
cp mtaa_os_lock_system/set-pin.tsx app/auth/set-pin.tsx
cp mtaa_os_lock_system/lock-screen.tsx "app/(os)/lock-screen.tsx"

echo "✅ Installed"

echo ""
echo "=== CLEANING DUPLICATES ==="
rm -f lib/stores/auth-store.ts
rm -f lib/auth/state/auth.store.ts.bak.*
rm -f lib/kernel/stores/authStore.ts.bak.*
rm -f lib/stores/auth-store.ts.bak.*
rm -f lib_auth_identity.ts
rm -f lib_auth_os-gate.ts
rm -f lib_auth_use-identity.ts
rm -f lib_kernel_auth_useAuthStore.ts
rm -f lib_security_pin-engine.ts

echo ""
echo "=== DONE ==="
echo "Run: npx expo start --clear"
