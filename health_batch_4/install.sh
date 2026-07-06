#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "=== BATCH 4: Hospital Admin + Cashier Screens ==="
mkdir -p ../app/\(os\)/health/hospital-admin/revenue
mkdir -p ../app/\(os\)/health/cashier/payments
mkdir -p ../app/\(os\)/health/cashier/insurance
mkdir -p ../app/\(os\)/health/cashier/invoices
mkdir -p ../app/\(os\)/health/cashier/revenue
cp hospital-admin/revenue/index.tsx ../app/\(os\)/health/hospital-admin/revenue/index.tsx
cp cashier/payments/index.tsx ../app/\(os\)/health/cashier/payments/index.tsx
cp cashier/insurance/index.tsx ../app/\(os\)/health/cashier/insurance/index.tsx
cp cashier/invoices/index.tsx ../app/\(os\)/health/cashier/invoices/index.tsx
cp cashier/revenue/index.tsx ../app/\(os\)/health/cashier/revenue/index.tsx
echo "✅ Batch 4 installed (5 files)"
