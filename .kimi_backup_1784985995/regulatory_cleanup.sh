#!/bin/bash
# ============================================
# REGULATORY CLEANUP SCRIPT
# Run this from ~/MTAA_OS_V10
# ============================================

echo "=== REGULATORY CLEANUP ==="

# 1. Delete duplicate route groups
echo "Removing duplicate routes..."
rm -f app/(os)/regulatory.tsx
rm -f app/(os)/wallet/regulatory.tsx
rm -rf app/(regulatory)/ 2>/dev/null || true

# 2. Delete old regulatory domain (replaced by civic/regulatory)
echo "Removing old regulatory domain..."
rm -rf domains/regulatory/

# 3. Delete backup files
echo "Removing backup files..."
find . -name "*.bak.*" -delete
find . -name "*.backup.*" -delete
find . -path "*/backups/*" -name "*regulatory*" -delete

# 4. Delete duplicate manifest
echo "Removing duplicate manifests..."
rm -f ./backups/phase0_archive_*/frontend_backups/regulatory_manifest_duplicate_*.ts

echo "=== CLEANUP COMPLETE ==="
echo ""
echo "Next steps:"
echo "1. Extract all 6 ZIPs into ~/MTAA_OS_V10"
echo "2. Run: npx supabase functions deploy regulatory-audit"
echo "3. Run: npx supabase functions deploy regulatory-compliance"
echo "4. Run: npx supabase functions deploy regulatory-tax"
echo "5. Run sql/regulatory_rls_policies.sql in Supabase SQL Editor"
echo "6. Restart dev server: npx expo start -c"
