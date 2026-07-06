#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "=== BATCH 2: Doctor Earnings + Nurse + Pharmacy Queue ==="
mkdir -p ../app/\(os\)/health/doctor/earnings
mkdir -p ../app/\(os\)/health/nurse/beds
mkdir -p ../app/\(os\)/health/nurse/medication
mkdir -p ../app/\(os\)/health/nurse/handover
mkdir -p ../app/\(os\)/health/pharmacy/queue
cp doctor/earnings/index.tsx ../app/\(os\)/health/doctor/earnings/index.tsx
cp nurse/beds/index.tsx ../app/\(os\)/health/nurse/beds/index.tsx
cp nurse/medication/index.tsx ../app/\(os\)/health/nurse/medication/index.tsx
cp nurse/handover/index.tsx ../app/\(os\)/health/nurse/handover/index.tsx
cp pharmacy/queue/index.tsx ../app/\(os\)/health/pharmacy/queue/index.tsx
echo "✅ Batch 2 installed (5 files)"
