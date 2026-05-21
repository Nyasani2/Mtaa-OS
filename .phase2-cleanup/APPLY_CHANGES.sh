#!/bin/bash
# Apply Phase 2 changes to MTAA_OS_V10
# Run AFTER EXTRACT_FIRST.sh

set -e

PROJECT_DIR="$HOME/MTAA_OS_V10"
PHASE2_DIR="$PROJECT_DIR/.phase2-cleanup"

echo "=========================================="
echo "  Applying Phase 2 Changes"
echo "=========================================="
echo ""

apply_file() {
    local src="$1"
    local dest="$PROJECT_DIR/$2"
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    echo "  ✅ $2"
}

cd "$PHASE2_DIR"

echo "[FIXES]"
apply_file "fixes/lib/integrations/rails/rail-registry.ts" "lib/integrations/rails/rail-registry.ts"
apply_file "fixes/hooks/useUser.ts" "hooks/useUser.ts"
apply_file "fixes/hooks/useAuth.ts" "hooks/useAuth.ts"
apply_file "fixes/app/(os)/settings/_layout.tsx" "app/(os)/settings/_layout.tsx"

echo ""
echo "[MANIFESTS]"
apply_file "manifests/tribes-manifest.ts" "lib/mtaa/apps/tribes-manifest.ts"
apply_file "manifests/education-manifest.ts" "lib/mtaa/apps/education-manifest.ts"
apply_file "manifests/civic-manifest.ts" "lib/mtaa/apps/civic-manifest.ts"
apply_file "manifests/health-manifest.ts" "lib/mtaa/apps/health-manifest.ts"
apply_file "manifests/streets-manifest.ts" "lib/mtaa/apps/streets-manifest.ts"
apply_file "manifests/analytics-manifest.ts" "lib/mtaa/apps/analytics-manifest.ts"

echo ""
echo "[CLEANUP SCRIPTS]"
apply_file "scripts/remove-duplicates.sh" "scripts/remove-duplicates.sh"
apply_file "scripts/remove-stubs.sh" "scripts/remove-stubs.sh"
apply_file "scripts/broken-import-audit.sh" "scripts/broken-import-audit.sh"

echo ""
echo "[RLS SQL]"
apply_file "sql/rls-remaining-tables.sql" "sql/rls-remaining-tables.sql"

echo ""
echo "[KERNEL STABILITY]"
apply_file "kernel/boot-sequence.ts" "lib/mtaa/kernel/boot-sequence.ts"
apply_file "kernel/service-manager.ts" "lib/mtaa/kernel/service-manager.ts"
apply_file "kernel/panic-handler.ts" "lib/mtaa/kernel/panic-handler.ts"
apply_file "kernel/safe-mode.tsx" "lib/mtaa/kernel/safe-mode.tsx"
apply_file "kernel/memory-watchdog.ts" "lib/mtaa/kernel/memory-watchdog.ts"

echo ""
echo "[LAZY LOADING]"
apply_file "lazy-loading/route-loader.tsx" "lib/mtaa/lazy-loading/route-loader.tsx"
apply_file "lazy-loading/app-chunker.ts" "lib/mtaa/lazy-loading/app-chunker.ts"
apply_file "lazy-loading/deferred-hydration.tsx" "lib/mtaa/lazy-loading/deferred-hydration.tsx"

echo ""
echo "[APP STORE WIRING]"
apply_file "appstore/unified-registry.ts" "lib/mtaa/appstore/unified-registry.ts"
apply_file "appstore/install-lifecycle.ts" "lib/mtaa/appstore/install-lifecycle.ts"
apply_file "appstore/permission-system.ts" "lib/mtaa/appstore/permission-system.ts"

echo ""
echo "[OFFLINE & CACHE]"
apply_file "offline/cache-manager.ts" "lib/mtaa/offline/cache-manager.ts"
apply_file "offline/sync-queue.ts" "lib/mtaa/offline/sync-queue.ts"
apply_file "offline/state-persistence.ts" "lib/mtaa/offline/state-persistence.ts"

echo ""
echo "[DEEP LINKING]"
apply_file "deeplinking/link-handler.ts" "lib/mtaa/deeplinking/link-handler.ts"
apply_file "deeplinking/route-resolver.ts" "lib/mtaa/deeplinking/route-resolver.ts"

echo ""
echo "=========================================="
echo "  ✅ ALL PHASE 2 CHANGES APPLIED"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Run cleanup:  bash $PROJECT_DIR/scripts/remove-duplicates.sh"
echo "  2. Run cleanup:  bash $PROJECT_DIR/scripts/remove-stubs.sh"
echo "  3. Run SQL:      Copy sql/rls-remaining-tables.sql to Supabase Editor"
echo "  4. Test build:   cd $PROJECT_DIR && npx expo start --clear"
echo ""
