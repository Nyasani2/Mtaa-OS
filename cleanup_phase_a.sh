#!/bin/bash
# MTAA OS Phase A+B Cleanup + Manifest Generation Script
# Run from project root: ~/MTAA_OS_V10

set -e

echo "=== MTAA OS Phase A+B: Cleanup + Manifest Prep ==="
echo ""

# ============================================================
# PHASE A: DELETE OLD/DUPLICATE FILES
# ============================================================

echo "[1/12] Removing audit reports..."
rm -f ./audit/reports/auth-store-usage.txt
rm -f ./audit/reports/broken-files.txt
rm -f ./audit/reports/camera.txt
rm -f ./audit/reports/device.txt
rm -f ./audit/reports/empty-files.txt
rm -f ./audit/reports/filesystem.txt
rm -f ./audit/reports/maps.txt
rm -f ./audit/reports/native-imports.txt
rm -f ./audit/reports/native-routes.txt
rm -f ./audit/reports/qr.txt
rm -f ./audit/reports/small-files.txt
rm -f ./audit/reports/web-breakers.txt
rm -f ./audit/reports/webview.txt
rmdir ./audit/reports 2>/dev/null || true
rmdir ./audit 2>/dev/null || true

echo "[2/12] Removing cleanup/fix scripts..."
rm -f ./_fix_expo_router.sh
rm -f ./cleanup_phase1.sh
rm -f ./deploy_messenger_calls_part1.sh
rm -f ./deploy_messenger_calls_part2.sh
rm -f ./scripts/cleanup-os.sh
rm -f ./scripts/kernel-type-repair.sh
rm -f ./scripts/remove-duplicates.sh
rm -f ./scripts/remove-stubs.sh
rm -f ./scripts/broken-import-audit.sh

echo "[3/12] Removing old duplicate app folders (apps/ — domains/ is canonical)..."
rm -rf ./apps/appstore
rm -rf ./apps/marketplace
rm -rf ./apps/mtruck
rm -rf ./apps/shop
rm -rf ./apps/streets
rm -rf ./apps/treasury
rm -f ./apps/_contract.ts
rm -f ./apps/runtime.registry.ts
rm -f ./apps.registry.json

echo "[4/12] Removing old shop_module folder..."
rm -rf ./shop_module
rm -f ./shop_module_schema_FIXED.sql
rm -f ./shop_module_schema.sql
rm -f ./MTAA_Shop_Module.zip

echo "[5/12] Removing conversation-text schema dumps..."
rm -f ./schema_dump.sql
rm -f ./schema_data.sql

echo "[6/12] Removing old structure/list files..."
rm -f ./mtaa_clean_structure.txt
rm -f ./mtaa_structure.txt
rm -f ./structure.txt
rm -f ./frontend_files_list.txt
rm -f ./all_files.txt
rm -f ./mtaa_frontend_tree.txt

echo "[7/12] Removing lock files and old zips..."
rm -f ./.~lock.setup.sh.odt#
rm -f ./setup.sh.odt
rm -f ./mtaa_kernel_bundle.zip
rm -f ./mtaa_os_shell.zip
rm -f ./mtaa_os_shell_expo.zip
rm -f ./domains_structure.zip

echo "[8/12] Removing old SQL extracts..."
rm -f ./sql/shop_module_schema_extracted.sql

echo "[9/12] Removing duplicate manifest files..."
rm -f ./lib/mtaa/appstore/registry.ts:

echo "[10/12] Cleaning caches..."
rm -rf ./.expo/web/cache 2>/dev/null || true
rm -rf ./node_modules/.cache 2>/dev/null || true

echo "[11/12] Removing empty directories..."
find . -type d -empty -delete 2>/dev/null || true

echo "[12/12] Removing old civic treasury SQL (consolidated into civic-v2)..."
rm -f ./civic_full_rebuild_v2.sql

echo ""
echo "=== Phase A Cleanup Complete ==="
echo ""

# ============================================================
# VERIFY NO BROKEN IMPORTS FROM DELETED FILES
# ============================================================

echo "Checking for references to deleted files..."
if grep -r "apps/appstore" --include="*.ts" --include="*.tsx" ./app ./lib ./hooks ./components 2>/dev/null; then
    echo "WARNING: Found references to deleted apps/appstore/"
fi
if grep -r "apps/marketplace" --include="*.ts" --include="*.tsx" ./app ./lib ./hooks ./components 2>/dev/null; then
    echo "WARNING: Found references to deleted apps/marketplace/"
fi
if grep -r "apps/mtruck" --include="*.ts" --include="*.tsx" ./app ./lib ./hooks ./components 2>/dev/null; then
    echo "WARNING: Found references to deleted apps/mtruck/"
fi
if grep -r "apps/shop" --include="*.ts" --include="*.tsx" ./app ./lib ./hooks ./components 2>/dev/null; then
    echo "WARNING: Found references to deleted apps/shop/"
fi
if grep -r "apps/streets" --include="*.ts" --include="*.tsx" ./app ./lib ./hooks ./components 2>/dev/null; then
    echo "WARNING: Found references to deleted apps/streets/"
fi
if grep -r "apps/treasury" --include="*.ts" --include="*.tsx" ./app ./lib ./hooks ./components 2>/dev/null; then
    echo "WARNING: Found references to deleted apps/treasury/"
fi

echo ""
echo "Cleanup complete. Run: git add -A && git commit -m 'Phase A: Cleanup old files'"
echo ""
