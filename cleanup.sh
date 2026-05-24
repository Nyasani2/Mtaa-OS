#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  MTAA_OS_V10 — AUTH REFACTOR CLEANUP SCRIPT                  ║
# ║  Run this AFTER extracting the new auth files                  ║
# ╚══════════════════════════════════════════════════════════════╝

echo "=== MTAA OS Auth Refactor Cleanup ==="
echo ""

# Files to DELETE (old duplicated auth system)
FILES_TO_DELETE=(
  # Old auth stores (duplicated session state)
  "lib/stores/auth-store.ts"
  "hooks/useAuthStore.ts"

  # Old auth bridge (duplicate listener)
  "lib/auth/auth-bridge.ts"

  # Old auth kernel (mixed concerns)
  "lib/auth/auth-kernel.ts"

  # Old boot hook (replaced by identityEngine.boot)
  "lib/auth/use-auth-boot.ts"

  # Old PIN store (used Zustand instead of AsyncStorage)
  "lib/security/pin-store.ts"

  # Old useAuth hook (replaced by useIdentity)
  # Keep: hooks/useAuth.ts for gradual migration
  # (it will be deprecated, not deleted yet)
)

for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "✅ Deleted: $file"
  else
    echo "⚠️  Not found (already cleaned?): $file"
  fi
done

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "Next steps:"
echo "1. Update any imports from old paths to new paths:"
echo "   - useAuthStore → useIdentity (from @/lib/auth/identity)"
echo "   - authKernel → identityEngine (from @/lib/auth/identity)"
echo "   - pinStore → pinEngine (from @/lib/security/pin-engine)"
echo "   - useAuth → useIdentity (from @/lib/auth/identity)"
echo ""
echo "2. Test boot flow:"
echo "   - Fresh app: should show login"
echo "   - With session: should show lock screen (if PIN set)"
echo "   - With session + no PIN: should enter OS directly"
echo ""
