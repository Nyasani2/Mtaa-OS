#!/bin/bash
# MTAA OS V10 — Phase 0: Archive & Organize
# Run from ~/MTAA_OS_V10/
# This script MOVES (not deletes) all duplicates, backups, and orphans

set -e

cd ~/MTAA_OS_V10
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="backups/phase0_archive_${TIMESTAMP}"
WARNINGS=()
MOVED_COUNT=0

log() { echo "[$(date '+%H:%M:%S')] $1"; }
warn() { echo "[$(date '+%H:%M:%S')] ⚠️  WARNING: $1"; WARNINGS+=("$1"); }
ok() { echo "[$(date '+%H:%M:%S')] ✅ $1"; ((MOVED_COUNT++)) || true; }

echo "🔴 MTAA OS V10 — Phase 0: Archive & Organize"
echo "================================================"
echo "This will MOVE (not delete) duplicates and orphans to:"
echo "$BACKUP_ROOT"
echo ""
echo "Press Ctrl+C to cancel, or wait 3 seconds..."
sleep 3

# Create structure
mkdir -p $BACKUP_ROOT/{route_groups,frontend_backups,lib_backups,zip_archives,orphaned_screens,old_asis,android_build,ios_build,misc}
log "Backup structure created"

# ============================================================
# 0.2 MOVE DUPLICATE ROUTE GROUPS
# ============================================================
log "--- Archiving duplicate route groups ---"

if [ -d "app/os" ]; then
    mv app/os/ $BACKUP_ROOT/route_groups/os_duplicate_${TIMESTAMP}/
    ok "Moved app/os/ (duplicate of app/(os)/)"
else
    log "app/os/ not found — already clean"
fi

if [ -d "app/regulatory" ]; then
    mv app/regulatory/ $BACKUP_ROOT/route_groups/regulatory_duplicate_${TIMESTAMP}/
    ok "Moved app/regulatory/ (duplicate of app/(regulatory)/)"
else
    log "app/regulatory/ not found — already clean"
fi

if [ -d "app/(wallet)" ]; then
    mv "app/(wallet)" $BACKUP_ROOT/route_groups/wallet_deprecated_${TIMESTAMP}/
    ok "Moved app/(wallet)/ (deprecated)"
else
    log "app/(wallet)/ not found — already clean"
fi

if [ -d "wallet" ]; then
    mv wallet/ $BACKUP_ROOT/route_groups/wallet_flat_routes_${TIMESTAMP}/
    ok "Moved wallet/ (flat routes at root)"
else
    log "wallet/ not found — already clean"
fi

if [ -d "settings" ]; then
    mv settings/ $BACKUP_ROOT/route_groups/settings_flat_routes_${TIMESTAMP}/
    ok "Moved settings/ (flat route at root)"
else
    log "settings/ not found — already clean"
fi

if [ -f "app/index.tsx" ]; then
    mv app/index.tsx $BACKUP_ROOT/route_groups/app_index_root_${TIMESTAMP}.tsx
    ok "Moved app/index.tsx (blocks OS home)"
else
    log "app/index.tsx not found — already clean"
fi

# ============================================================
# 0.3 MOVE BACKUP FILES FROM ACTIVE DIRECTORIES
# ============================================================
log "--- Archiving .bak and .backup files ---"

BAK_COUNT=$(find app/ lib/ -name "*.bak.*" -o -name "*.backup*" 2>/dev/null | wc -l)
if [ "$BAK_COUNT" -gt 0 ]; then
    find app/ lib/ -name "*.bak.*" -type f -exec mv {} $BACKUP_ROOT/frontend_backups/ \; 2>/dev/null || true
    find app/ lib/ -name "*.backup*" -type f -exec mv {} $BACKUP_ROOT/frontend_backups/ \; 2>/dev/null || true
    ok "Moved $BAK_COUNT backup files from app/ and lib/"
else
    log "No .bak or .backup files found in active tree"
fi

# Profile .backup_v2 directory
if [ -d "app/(os)/profile/.backup_v2" ]; then
    mv "app/(os)/profile/.backup_v2/" $BACKUP_ROOT/frontend_backups/profile_backup_v2_${TIMESTAMP}/
    ok "Moved app/(os)/profile/.backup_v2/"
fi

# Health system backups
if [ -d "app/(os)/health/system" ]; then
    find app/(os)/health/system -name "*.bak.*" -type f -exec mv {} $BACKUP_ROOT/frontend_backups/ \; 2>/dev/null || true
fi

# lib/health backups
if [ -d "lib/health/hooks" ]; then
    find lib/health/hooks -name "*.bak.*" -type f -exec mv {} $BACKUP_ROOT/lib_backups/ \; 2>/dev/null || true
fi
if [ -d "lib/health/services" ]; then
    find lib/health/services -name "*.bak.*" -type f -exec mv {} $BACKUP_ROOT/lib_backups/ \; 2>/dev/null || true
fi

# Service/store backups
if [ -d "lib/services" ]; then
    find lib/services -name "*.bak.*" -type f -exec mv {} $BACKUP_ROOT/lib_backups/ \; 2>/dev/null || true
fi
if [ -d "lib/stores" ]; then
    find lib/stores -name "*.bak.*" -type f -exec mv {} $BACKUP_ROOT/lib_backups/ \; 2>/dev/null || true
fi
if [ -d "lib/hooks" ]; then
    find lib/hooks -name "*.backup*" -type f -exec mv {} $BACKUP_ROOT/lib_backups/ \; 2>/dev/null || true
fi

# Wallet backups
for dir in _wallet_backup_*; do
    if [ -d "$dir" ]; then
        mv "$dir" $BACKUP_ROOT/frontend_backups/
        ok "Moved $dir"
    fi
done

if [ -d "_orphaned_root_screens/wallet_services" ]; then
    mv _orphaned_root_screens/wallet_services/ $BACKUP_ROOT/frontend_backups/
    ok "Moved _orphaned_root_screens/wallet_services/"
fi

# ============================================================
# 0.4 MOVE ORPHANED SCREENS
# ============================================================
log "--- Archiving orphaned screens ---"

if [ -d "_orphaned_root_screens" ]; then
    mv _orphaned_root_screens/ $BACKUP_ROOT/orphaned_screens/orphaned_root_${TIMESTAMP}/
    ok "Moved _orphaned_root_screens/"
else
    log "_orphaned_root_screens/ not found — already clean"
fi

# ============================================================
# 0.5 MOVE OLD ASIS VERSIONS
# ============================================================
log "--- Archiving old ASIS versions ---"

if [ -d "lib/asis-v6" ]; then
    mv lib/asis-v6/ $BACKUP_ROOT/old_asis/asis_v6_${TIMESTAMP}/
    ok "Moved lib/asis-v6/"
else
    log "lib/asis-v6/ not found — already clean"
fi

if [ -d "lib/asis-v7" ]; then
    mv lib/asis-v7/ $BACKUP_ROOT/old_asis/asis_v7_${TIMESTAMP}/
    ok "Moved lib/asis-v7/"
else
    log "lib/asis-v7/ not found — already clean"
fi

# ============================================================
# 0.6 MOVE ZIP FILES FROM REPO
# ============================================================
log "--- Archiving ZIP files ---"

ZIP_COUNT=$(find . -maxdepth 1 -name "*.zip" -o -name "*.tar.gz" 2>/dev/null | wc -l)
if [ "$ZIP_COUNT" -gt 0 ]; then
    find . -maxdepth 1 -name "*.zip" -type f -exec mv {} $BACKUP_ROOT/zip_archives/ \;
    find . -maxdepth 1 -name "*.tar.gz" -type f -exec mv {} $BACKUP_ROOT/zip_archives/ \;
    mv asis_*.zip $BACKUP_ROOT/zip_archives/ 2>/dev/null || true
    mv garage_*.zip $BACKUP_ROOT/zip_archives/ 2>/dev/null || true
    mv *_fix*.zip $BACKUP_ROOT/zip_archives/ 2>/dev/null || true
    mv *_complete*.zip $BACKUP_ROOT/zip_archives/ 2>/dev/null || true
    ok "Moved $ZIP_COUNT ZIP/tar.gz files"
else
    log "No ZIP files found in project root"
fi

# ============================================================
# 0.7 MOVE BUILD ARTIFACTS
# ============================================================
log "--- Archiving build artifacts ---"

if [ -d "android/app/build" ]; then
    mv android/app/build/ $BACKUP_ROOT/android_build/app_build_${TIMESTAMP}/
    ok "Moved android/app/build/"
else
    log "android/app/build/ not found"
fi

if [ -d "ios/build" ]; then
    mv ios/build/ $BACKUP_ROOT/ios_build/ios_build_${TIMESTAMP}/
    ok "Moved ios/build/"
else
    log "ios/build/ not found"
fi

# ============================================================
# 0.8 MOVE DUPLICATE AUTH STORE FILES
# ============================================================
log "--- Archiving duplicate auth stores ---"

if [ -f "lib/hooks/useAuth.ts" ]; then
    mv lib/hooks/useAuth.ts $BACKUP_ROOT/lib_backups/hooks_useAuth_${TIMESTAMP}.ts
    ok "Moved lib/hooks/useAuth.ts"
else
    log "lib/hooks/useAuth.ts not found"
fi

if [ -f "lib/kernel/auth/useAuthStore.ts" ]; then
    mv lib/kernel/auth/useAuthStore.ts $BACKUP_ROOT/lib_backups/kernel_auth_useAuthStore_${TIMESTAMP}.ts
    ok "Moved lib/kernel/auth/useAuthStore.ts"
else
    log "lib/kernel/auth/useAuthStore.ts not found"
fi

if [ -f "lib/kernel/stores/useAuthStore.ts" ]; then
    mv lib/kernel/stores/useAuthStore.ts $BACKUP_ROOT/lib_backups/kernel_stores_useAuthStore_${TIMESTAMP}.ts
    ok "Moved lib/kernel/stores/useAuthStore.ts"
else
    log "lib/kernel/stores/useAuthStore.ts not found"
fi

# Malformed filename with colon
if [ -f "lib/stores/auth-store.ts:" ]; then
    mv "lib/stores/auth-store.ts:" $BACKUP_ROOT/lib_backups/stores_auth_store_colon_${TIMESTAMP}.ts
    ok "Moved lib/stores/auth-store.ts: (malformed filename)"
else
    log "lib/stores/auth-store.ts: not found"
fi

if [ -f "lib/stores/auth-store.ts" ]; then
    mv lib/stores/auth-store.ts $BACKUP_ROOT/lib_backups/stores_auth_store_${TIMESTAMP}.ts
    ok "Moved lib/stores/auth-store.ts"
else
    log "lib/stores/auth-store.ts not found"
fi

if [ -f "lib/auth/useAuthStore.ts" ]; then
    mv lib/auth/useAuthStore.ts $BACKUP_ROOT/lib_backups/auth_useAuthStore_${TIMESTAMP}.ts
    ok "Moved lib/auth/useAuthStore.ts"
else
    log "lib/auth/useAuthStore.ts not found"
fi

if [ -f "lib/auth/useAuth.ts" ]; then
    # Check if it has router logic (not a pure duplicate)
    if grep -q "router" lib/auth/useAuth.ts 2>/dev/null; then
        warn "lib/auth/useAuth.ts has router logic — keeping (review manually)"
    else
        mv lib/auth/useAuth.ts $BACKUP_ROOT/lib_backups/auth_useAuth_${TIMESTAMP}.ts
        ok "Moved lib/auth/useAuth.ts (pure re-export)"
    fi
else
    log "lib/auth/useAuth.ts not found"
fi

# Clean up empty directories
if [ -d "lib/kernel/auth" ] && [ -z "$(ls -A lib/kernel/auth 2>/dev/null)" ]; then
    rmdir lib/kernel/auth/
    ok "Removed empty lib/kernel/auth/"
fi

# ============================================================
# 0.9 MOVE DUPLICATE SUPABASE CLIENT FILES
# ============================================================
log "--- Archiving duplicate supabase clients ---"

if [ -f "lib/kernel/supabase.ts" ]; then
    if [ -f "lib/supabase.ts" ]; then
        if diff -q lib/supabase.ts lib/kernel/supabase.ts >/dev/null 2>&1; then
            mv lib/kernel/supabase.ts $BACKUP_ROOT/lib_backups/kernel_supabase_${TIMESTAMP}.ts
            ok "Moved lib/kernel/supabase.ts (exact duplicate)"
        else
            warn "lib/kernel/supabase.ts DIFFERS from lib/supabase.ts — manual review needed"
        fi
    else
        warn "lib/supabase.ts (canonical) not found — cannot verify kernel/supabase.ts"
    fi
else
    log "lib/kernel/supabase.ts not found"
fi

if [ -f "lib/integrations/supabase/client.ts" ]; then
    mv lib/integrations/supabase/client.ts $BACKUP_ROOT/lib_backups/integrations_supabase_client_${TIMESTAMP}.ts
    ok "Moved lib/integrations/supabase/client.ts"
else
    log "lib/integrations/supabase/client.ts not found"
fi

if [ -f "lib/supabase/client.ts" ]; then
    if [ -f "lib/supabase.ts" ]; then
        if diff -q lib/supabase.ts lib/supabase/client.ts >/dev/null 2>&1; then
            mv lib/supabase/client.ts $BACKUP_ROOT/lib_backups/supabase_client_duplicate_${TIMESTAMP}.ts
            ok "Moved lib/supabase/client.ts (exact duplicate)"
        else
            warn "lib/supabase/client.ts DIFFERS from lib/supabase.ts — manual review needed"
        fi
    else
        warn "lib/supabase.ts (canonical) not found — cannot verify supabase/client.ts"
    fi
else
    log "lib/supabase/client.ts not found"
fi

# ============================================================
# 0.10 MOVE DUPLICATE REGISTRATION SCREENS
# ============================================================
log "--- Archiving duplicate registration screens ---"

if [ -f "app/auth/register.tsx" ]; then
    mv app/auth/register.tsx $BACKUP_ROOT/frontend_backups/auth_register_duplicate_${TIMESTAMP}.tsx
    ok "Moved app/auth/register.tsx"
else
    log "app/auth/register.tsx not found"
fi

if [ -f "app/auth/first-boot.tsx" ]; then
    mv app/auth/first-boot.tsx $BACKUP_ROOT/frontend_backups/auth_firstboot_duplicate_${TIMESTAMP}.tsx
    ok "Moved app/auth/first-boot.tsx"
else
    log "app/auth/first-boot.tsx not found"
fi

# ============================================================
# 0.11 MOVE DUPLICATE PIN CHANGE SCREENS
# ============================================================
log "--- Archiving duplicate PIN screens ---"

if [ -f "app/(os)/settings/pin.tsx" ]; then
    mv "app/(os)/settings/pin.tsx" $BACKUP_ROOT/frontend_backups/settings_pin_duplicate_${TIMESTAMP}.tsx
    ok "Moved app/(os)/settings/pin.tsx"
else
    log "app/(os)/settings/pin.tsx not found"
fi

# ============================================================
# 0.12 MOVE DUPLICATE CBKDASHBOARD
# ============================================================
log "--- Archiving duplicate CBKDashboard files ---"

find domains/regulatory/components -name "*CBKDashboard*" -type f 2>/dev/null | while read f; do
    if [[ "$f" == *"(1)"* ]] || [[ "$f" == *" "* ]]; then
        mv "$f" $BACKUP_ROOT/frontend_backups/
        ok "Moved duplicate CBKDashboard: $(basename "$f")"
    fi
done

# ============================================================
# 0.13 MOVE DUPLICATE REGULATORY MANIFESTS
# ============================================================
log "--- Archiving duplicate regulatory manifests ---"

if [ -f "lib/modules/regulatory/manifest.ts" ]; then
    mv lib/modules/regulatory/manifest.ts $BACKUP_ROOT/frontend_backups/regulatory_manifest_duplicate_${TIMESTAMP}.ts
    ok "Moved lib/modules/regulatory/manifest.ts"
else
    log "lib/modules/regulatory/manifest.ts not found"
fi

# ============================================================
# 0.14 GENERATE ARCHIVE MANIFEST
# ============================================================
log "--- Generating archive manifest ---"

MANIFEST_FILE="$BACKUP_ROOT/ARCHIVE_MANIFEST_${TIMESTAMP}.md"

cat > "$MANIFEST_FILE" << EOF
# MTAA OS V10 — Phase 0 Archive Manifest
## Date: $(date)
## Action: Moved duplicates, backups, and orphans to backup folder (NOT deleted)
## Backup Location: $BACKUP_ROOT

## Summary
- Total items moved: $(find $BACKUP_ROOT -type f | wc -l)
- Total size: $(du -sh $BACKUP_ROOT | cut -f1)
- Warnings encountered: ${#WARNINGS[@]}

## Warnings Requiring Manual Review
EOF

if [ ${#WARNINGS[@]} -eq 0 ]; then
    echo "None — all items were exact duplicates or safe to move." >> "$MANIFEST_FILE"
else
    for w in "${WARNINGS[@]}"; do
        echo "- $w" >> "$MANIFEST_FILE"
    done
fi

cat >> "$MANIFEST_FILE" << EOF

## Archive Structure
\`\`\`
$(find $BACKUP_ROOT -type d | sort | sed "s|$BACKUP_ROOT||")
\`\`\`

## Complete File Listing
EOF

find $BACKUP_ROOT -type f | sort >> "$MANIFEST_FILE"

ok "Archive manifest generated: $MANIFEST_FILE"

# ============================================================
# 0.15 UPDATE .gitignore
# ============================================================
log "--- Updating .gitignore ---"

if ! grep -q "backups/phase0_archive" .gitignore 2>/dev/null; then
    cat >> .gitignore << 'EOF'

# === PHASE 0: ARCHIVED FILES (never commit backups) ===
# Backup archives
backups/phase0_archive_*/
backups/
*.bak.*
*.backup*
_orphaned_root_screens/
_wallet_backup_*/

# Build artifacts
android/app/build/
ios/build/
*.apk
*.aab

# Archives
*.zip
*.tar.gz

# Logs
*.log
EOF
    ok ".gitignore updated"
else
    log ".gitignore already contains backup rules"
fi

# ============================================================
# 0.16 VERIFY CLEAN STATE
# ============================================================
log "=== VERIFYING CLEAN STATE ==="

echo ""
echo "--- Remaining .bak files in active tree ---"
REMAINING_BAK=$(find app/ lib/ -name "*.bak.*" -o -name "*.backup*" 2>/dev/null | wc -l)
if [ "$REMAINING_BAK" -gt 0 ]; then
    warn "$REMAINING_BAK .bak/.backup files still in active tree"
    find app/ lib/ -name "*.bak.*" -o -name "*.backup*" 2>/dev/null | head -10
else
    ok "No .bak or .backup files in active tree"
fi

echo ""
echo "--- Remaining duplicate route groups ---"
REMAINING_DUPES=0
for dir in app/os app/regulatory "app/(wallet)" wallet settings; do
    if [ -e "$dir" ]; then
        warn "$dir still exists"
        ((REMAINING_DUPES++)) || true
    fi
done
if [ "$REMAINING_DUPES" -eq 0 ]; then
    ok "No duplicate route groups found"
fi

echo ""
echo "--- Remaining ZIP files in root ---"
REMAINING_ZIP=$(find . -maxdepth 1 -name "*.zip" -o -name "*.tar.gz" 2>/dev/null | wc -l)
if [ "$REMAINING_ZIP" -gt 0 ]; then
    warn "$REMAINING_ZIP ZIP files still in project root"
    find . -maxdepth 1 -name "*.zip" -o -name "*.tar.gz" 2>/dev/null | head -5
else
    ok "No ZIP files in project root"
fi

echo ""
echo "--- Remaining orphaned screens ---"
if [ -d "_orphaned_root_screens" ]; then
    warn "_orphaned_root_screens/ still exists"
else
    ok "No orphaned screens directory"
fi

echo ""
echo "--- Remaining old ASIS versions ---"
REMAINING_ASIS=0
for dir in lib/asis-v6 lib/asis-v7; do
    if [ -d "$dir" ]; then
        warn "$dir still exists"
        ((REMAINING_ASIS++)) || true
    fi
done
if [ "$REMAINING_ASIS" -eq 0 ]; then
    ok "No old ASIS versions found"
fi

echo ""
echo "--- Auth store files remaining ---"
if [ -f "lib/auth/store/auth.store.ts" ]; then
    ok "Canonical auth store: lib/auth/store/auth.store.ts ✅"
else
    warn "Canonical auth store NOT FOUND"
fi

echo ""
echo "--- Supabase client files remaining ---"
if [ -f "lib/supabase.ts" ]; then
    ok "Canonical supabase client: lib/supabase.ts ✅"
else
    warn "Canonical supabase client NOT FOUND"
fi

echo ""
echo "=== PHASE 0 COMPLETE ==="
echo "================================================"
echo "Backup location: $BACKUP_ROOT"
echo "Total items archived: $(find $BACKUP_ROOT -type f | wc -l)"
echo "Total size: $(du -sh $BACKUP_ROOT | cut -f1)"
echo "Warnings: ${#WARNINGS[@]}"
echo ""

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo "⚠️  WARNINGS REQUIRING MANUAL REVIEW:"
    for w in "${WARNINGS[@]}"; do
        echo "   - $w"
    done
    echo ""
    echo "These files were NOT moved because they differ from the canonical version."
    echo "Review them manually and decide: keep, merge, or archive."
    exit 1
else
    echo "✅ ALL CLEAR — No warnings. Ready for Phase 1."
    exit 0
fi
