#!/bin/bash
OUT=~/Desktop/wallet_audit_dump.txt
echo "=== MTAA OS V10 WALLET AUDIT DUMP ===" > "$OUT"
echo "Generated: $(date)" >> "$OUT"
echo "" >> "$OUT"

dump_file() {
  local path="$1"
  local label="$2"
  echo "" >> "$OUT"
  echo "========================================" >> "$OUT"
  echo "FILE: $label" >> "$OUT"
  echo "PATH: $path" >> "$OUT"
  echo "========================================" >> "$OUT"
  if [ -f "$path" ]; then
    cat "$path" >> "$OUT"
  else
    echo ">>> FILE NOT FOUND <<<" >> "$OUT"
  fi
  echo "" >> "$OUT"
  echo "--- END $label ---" >> "$OUT"
}

dump_file ~/MTAA_OS_V10/lib/services/wallet-service.ts "wallet-service.ts"
dump_file ~/MTAA_OS_V10/lib/services/wallet-service-additions.ts "wallet-service-additions.ts"
dump_file ~/MTAA_OS_V10/lib/identity/hooks/useWallet.ts "identity/hooks/useWallet.ts"
dump_file ~/MTAA_OS_V10/lib/health/services/wallet-health.service.ts "health/services/wallet-health.service.ts"
dump_file ~/MTAA_OS_V10/lib/health/hooks/useWalletHealth.ts "health/hooks/useWalletHealth.ts"
dump_file ~/MTAA_OS_V10/lib/wallet/services/withdraw.service.ts "wallet/services/withdraw.service.ts"
dump_file ~/MTAA_OS_V10/lib/wallet/state/wallet.store.ts "wallet/state/wallet.store.ts"
dump_file ~/MTAA_OS_V10/lib/wallet/hooks/useWallet.ts "wallet/hooks/useWallet.ts"
dump_file ~/MTAA_OS_V10/app/\(os\)/wallet/notifications.tsx "app/(os)/wallet/notifications.tsx"
dump_file ~/MTAA_OS_V10/app/\(education\)/fees/index.tsx "app/(education)/fees/index.tsx"
dump_file ~/MTAA_OS_V10/app/\(commerce\)/marketplace/checkout.tsx "app/(commerce)/marketplace/checkout.tsx"
dump_file ~/MTAA_OS_V10/app/\(commerce\)/shop/\[id\]/wallet.tsx "app/(commerce)/shop/[id]/wallet.tsx"
dump_file ~/MTAA_OS_V10/app/\(os\)/property/payment.tsx "app/(os)/property/payment.tsx"
dump_file ~/MTAA_OS_V10/app/\(os\)/wallet/transfer/index.tsx "app/(os)/wallet/transfer/index.tsx"
dump_file ~/MTAA_OS_V10/app/\(os\)/wallet/withdraw/index.tsx "app/(os)/wallet/withdraw/index.tsx"
dump_file ~/MTAA_OS_V10/lib/services/mpesa-service.ts "services/mpesa-service.ts"
dump_file ~/MTAA_OS_V10/lib/system/adapters/wallet-adapter.ts "system/adapters/wallet-adapter.ts"
dump_file ~/MTAA_OS_V10/lib/hookup/wallet-bridge/walletCoreEngine.ts "hookup/wallet-bridge/walletCoreEngine.ts"
dump_file ~/MTAA_OS_V10/lib/wallet/hooks/useWalletTaxes.ts "wallet/hooks/useWalletTaxes.ts"

echo "" >> "$OUT"
echo "========================================" >> "$OUT"
echo "SUPABASE TYPE DEFINITIONS (mtaa_credit_wallet)" >> "$OUT"
echo "========================================" >> "$OUT"
grep -A 20 "mtaa_credit_wallet" ~/MTAA_OS_V10/lib/types/supabase.ts >> "$OUT" 2>/dev/null || echo ">>> mtaa_credit_wallet NOT FOUND in supabase.ts <<<" >> "$OUT"

echo "" >> "$OUT"
echo "=== DUMP COMPLETE ===" >> "$OUT"
echo "File saved to: $OUT"
echo "Size: $(wc -c < "$OUT") bytes"
