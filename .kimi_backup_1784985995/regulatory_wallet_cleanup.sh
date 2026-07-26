#!/bin/bash
# ============================================
# REGULATORY WALLET INTEGRATION CLEANUP
# Run from ~/MTAA_OS_V10
# ============================================

echo "=== Regulatory Wallet Integration Cleanup ==="

# 1. Remove standalone regulatory routes (now inside wallet)
rm -f app/(os)/regulatory.tsx
rm -rf app/(regulatory)/ 2>/dev/null || true

# 2. Remove duplicate civic regulatory pages (replaced by wallet screen)
rm -rf domains/civic/regulatory/pages/ 2>/dev/null || true

# 3. Remove old regulatory domain
rm -rf domains/regulatory/

# 4. Remove old manifests
rm -f manifests/regulatory_manifest.ts
find . -path "*/backups/*" -name "*regulatory*manifest*" -delete

# 5. Remove old edge functions (replaced by tax-* functions)
rm -rf supabase/functions/regulatory-audit/
rm -rf supabase/functions/regulatory-compliance/
rm -rf supabase/functions/regulatory-tax/

# 6. Clean backup files
find . -name "*.bak.*" -delete
find . -name "*.backup.*" -delete

echo "=== Cleanup complete ==="
echo ""
echo "Next:"
echo "1. Extract all 6 ZIPs into ~/MTAA_OS_V10"
echo "2. Run SQL files in Supabase SQL Editor (in order):"
echo "   a) sql/tax_withholding_schema.sql"
echo "   b) sql/wallet_tax_rpc_functions.sql"
echo "   c) sql/jurisdiction_configs.sql"
echo "3. Deploy edge functions:"
echo "   npx supabase functions deploy tax-withhold"
echo "   npx supabase functions deploy tax-remit"
echo "   npx supabase functions deploy jurisdiction-config"
echo "4. Wire useTransactionTax into MTaxi/MTruck/Boda payment flows"
echo "5. Wire useCommerceTax into Shop/Restaurant order completion"
echo "6. Wire useCreatorTax into Streets/Pulse earnings disbursement"
echo "7. npx expo start -c"
