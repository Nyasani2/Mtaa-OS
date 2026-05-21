#!/bin/bash
# MTAA_OS_V10 — Phase 1: Clean House Script
# Run this from ~/MTAA_OS_V10
# WARNING: This moves files to _TRASH/ — review before permanent deletion

set -e

echo "=========================================="
echo "  MTAA OS — CLEAN HOUSE PHASE 1"
echo "=========================================="
echo ""

# Create trash directory with timestamp
TRASH_DIR="_TRASH_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TRASH_DIR"
echo "📁 Trash directory: $TRASH_DIR"
echo ""

# ============================================
# 1. REMOVE DUPLICATE APP STORES
# ============================================
echo "🗑️  Step 1: Removing duplicate app stores..."

# Old hardcoded app-store (5.4KB, dead buttons)
if [ -d "app/(os)/app-store" ]; then
    mv "app/(os)/app-store" "$TRASH_DIR/app-store-old"
    echo "   ✓ Moved app/(os)/app-store → $TRASH_DIR/"
fi

# Old apps/ wallet (duplicate of app/(os)/wallet/)
if [ -d "app/(os)/apps/wallet" ]; then
    mv "app/(os)/apps/wallet" "$TRASH_DIR/apps-wallet-old"
    echo "   ✓ Moved app/(os)/apps/wallet → $TRASH_DIR/"
fi

# Remove empty apps/ folder if nothing left
if [ -d "app/(os)/apps" ]; then
    rmdir "app/(os)/apps" 2>/dev/null || true
    echo "   ✓ Removed empty app/(os)/apps/"
fi

# ============================================
# 2. REMOVE STUB APPS (no real code)
# ============================================
echo ""
echo "🗑️  Step 2: Removing stub apps..."

# Calendar — 333 bytes stub
if [ -d "app/(os)/calendar" ]; then
    FILE_COUNT=$(find "app/(os)/calendar" -type f | wc -l)
    if [ "$FILE_COUNT" -le 2 ]; then
        mv "app/(os)/calendar" "$TRASH_DIR/calendar-stub"
        echo "   ✓ Moved app/(os)/calendar (stub) → $TRASH_DIR/"
    fi
fi

# Phone — 334 bytes stub
if [ -d "app/(os)/phone" ]; then
    FILE_COUNT=$(find "app/(os)/phone" -type f | wc -l)
    if [ "$FILE_COUNT" -le 2 ]; then
        mv "app/(os)/phone" "$TRASH_DIR/phone-stub"
        echo "   ✓ Moved app/(os)/phone (stub) → $TRASH_DIR/"
    fi
fi

# WiFi — 328 bytes stub
if [ -d "app/(os)/wifi" ]; then
    FILE_COUNT=$(find "app/(os)/wifi" -type f | wc -l)
    if [ "$FILE_COUNT" -le 2 ]; then
        mv "app/(os)/wifi" "$TRASH_DIR/wifi-stub"
        echo "   ✓ Moved app/(os)/wifi (stub) → $TRASH_DIR/"
    fi
fi

# Scanner — 0 files
if [ -d "app/(os)/scanner" ]; then
    FILE_COUNT=$(find "app/(os)/scanner" -type f | wc -l)
    if [ "$FILE_COUNT" -eq 0 ]; then
        mv "app/(os)/scanner" "$TRASH_DIR/scanner-empty"
        echo "   ✓ Moved app/(os)/scanner (empty) → $TRASH_DIR/"
    fi
fi

# ============================================
# 3. ARCHIVE OLD BACKUPS (already backed up)
# ============================================
echo ""
echo "🗑️  Step 3: Archiving old backups..."

# Phase 0 backup (already superseded by current code)
if [ -d "_PHASE0_BACKUP" ]; then
    mv "_PHASE0_BACKUP" "$TRASH_DIR/_PHASE0_BACKUP"
    echo "   ✓ Moved _PHASE0_BACKUP → $TRASH_DIR/"
fi

# Archive cleanup folder
if [ -d "_ARCHIVE/appstore_cleanup" ]; then
    mv "_ARCHIVE/appstore_cleanup" "$TRASH_DIR/_ARCHIVE_appstore_cleanup"
    echo "   ✓ Moved _ARCHIVE/appstore_cleanup → $TRASH_DIR/"
fi

# ============================================
# 4. DISABLED MODULES — Move to trash (keep modules_disabled/ itself)
# ============================================
echo ""
echo "🗑️  Step 4: Moving disabled civic modules..."

for module in civic-border-ui civic-courts civic-police civic-prisons; do
    if [ -d "modules_disabled/$module" ]; then
        mv "modules_disabled/$module" "$TRASH_DIR/modules_disabled_$module"
        echo "   ✓ Moved modules_disabled/$module → $TRASH_DIR/"
    fi
done

# ============================================
# 5. CLEAN UP _QUARANTINE_NEXTJS
# ============================================
echo ""
echo "🗑️  Step 5: Cleaning quarantined NextJS components..."

if [ -d "_QUARANTINE_NEXTJS" ]; then
    mv "_QUARANTINE_NEXTJS" "$TRASH_DIR/_QUARANTINE_NEXTJS"
    echo "   ✓ Moved _QUARANTINE_NEXTJS → $TRASH_DIR/"
fi

# ============================================
# 6. CLEAN UP OLD DOMAINS
# ============================================
echo ""
echo "🗑️  Step 6: Cleaning old domain structures..."

if [ -d "domains/civic_isolated" ]; then
    mv "domains/civic_isolated" "$TRASH_DIR/domains_civic_isolated"
    echo "   ✓ Moved domains/civic_isolated → $TRASH_DIR/"
fi

# ============================================
# 7. SUMMARY
# ============================================
echo ""
echo "=========================================="
echo "  CLEANUP COMPLETE"
echo "=========================================="
echo ""
echo "Trash directory: $TRASH_DIR"
echo "Size: $(du -sh "$TRASH_DIR" 2>/dev/null | cut -f1)"
echo ""
echo "Remaining active apps in app/(os)/:"
ls -1 app/\(os\)/ 2>/dev/null | grep -v "^$" || echo "   (none found)"
echo ""
echo "Remaining lib modules:"
ls -1 lib/ 2>/dev/null | head -20
echo ""
echo "✅ Review $TRASH_DIR before permanent deletion"
echo "✅ Run: rm -rf $TRASH_DIR  # when ready to permanently delete"
