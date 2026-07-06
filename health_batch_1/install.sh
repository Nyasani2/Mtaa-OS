#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "=== BATCH 1: Admin Analytics + Doctor Screens ==="
mkdir -p ../app/\(os\)/health/system/analytics
mkdir -p ../app/\(os\)/health/doctor/queue
mkdir -p ../app/\(os\)/health/doctor/schedule
mkdir -p ../app/\(os\)/health/doctor/prescribe
mkdir -p ../app/\(os\)/health/doctor/lab-orders
cp system/analytics/index.tsx ../app/\(os\)/health/system/analytics/index.tsx
cp doctor/queue/index.tsx ../app/\(os\)/health/doctor/queue/index.tsx
cp doctor/schedule/index.tsx ../app/\(os\)/health/doctor/schedule/index.tsx
cp doctor/prescribe/index.tsx ../app/\(os\)/health/doctor/prescribe/index.tsx
cp doctor/lab-orders/index.tsx ../app/\(os\)/health/doctor/lab-orders/index.tsx
echo "✅ Batch 1 installed (5 files)"
