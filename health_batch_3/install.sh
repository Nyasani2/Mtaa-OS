#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "=== BATCH 3: Pharmacy + Lab Screens ==="
mkdir -p ../app/\(os\)/health/pharmacy/interactions
mkdir -p ../app/\(os\)/health/pharmacy/suppliers
mkdir -p ../app/\(os\)/health/lab/queue
mkdir -p ../app/\(os\)/health/lab/critical
mkdir -p ../app/\(os\)/health/lab/equipment
cp pharmacy/interactions/index.tsx ../app/\(os\)/health/pharmacy/interactions/index.tsx
cp pharmacy/suppliers/index.tsx ../app/\(os\)/health/pharmacy/suppliers/index.tsx
cp lab/queue/index.tsx ../app/\(os\)/health/lab/queue/index.tsx
cp lab/critical/index.tsx ../app/\(os\)/health/lab/critical/index.tsx
cp lab/equipment/index.tsx ../app/\(os\)/health/lab/equipment/index.tsx
echo "✅ Batch 3 installed (5 files)"
