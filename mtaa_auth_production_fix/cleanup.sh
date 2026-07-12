#!/bin/bash
# MTAA OS V10 — Production Auth Cleanup
# Removes duplicate/broken auth stores. KEEPS canonical files.

cd ~/MTAA_OS_V10

echo "=== CLEANING UP DUPLICATE AUTH STORES ==="

# Remove broken backup files
rm -f lib/auth/state/auth.store.ts.bak.*
rm -f lib/kernel/stores/authStore.ts.bak.*
rm -f lib/stores/auth-store.ts.bak.*

# Remove duplicate stores (keep canonical lib/auth/store/auth.store.ts)
rm -f lib/stores/auth-store.ts
rm -f lib/kernel/stores/authStore.ts
rm -f lib/auth/state/auth.store.ts

# Remove orphaned files
rm -f lib_auth_identity.ts
rm -f lib_auth_os-gate.ts
rm -f lib_auth_use-identity.ts
rm -f lib_kernel_auth_useAuthStore.ts
rm -f lib_security_pin-engine.ts

echo "=== VERIFYING CANONICAL FILES ==="
for f in \
  lib/auth/store/auth.store.ts \
  lib/auth/useAuth.ts \
  lib/auth/use-identity.ts \
  lib/auth/index.ts \
  lib/security/pin-engine.ts \
  lib/hooks/useAuth.ts \
  lib/hooks/useIdentity.ts \
  lib/hooks/useAdmin.ts \
  lib/hooks/index.ts; do
  if [ -f "$f" ]; then
    echo "✅ $f"
  else
    echo "⚠️  MISSING: $f"
  fi
done

echo ""
echo "=== REMAINING AUTH FILES (non-node_modules) ==="
find . -type f \
  \( -name "*auth*" -o -name "*pin*" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/.backup/*" \
  ! -path "*/schema_snapshot/*" \
  | sort
