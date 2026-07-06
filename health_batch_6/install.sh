#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Health OS Batch 6: Ambulance + Receptionist Screens ==="
echo "Installing 6 files..."

mkdir -p "$PROJECT_ROOT/app/(os)/health/ambulance/dispatches"
mkdir -p "$PROJECT_ROOT/app/(os)/health/ambulance/location"
mkdir -p "$PROJECT_ROOT/app/(os)/health/ambulance/log"
mkdir -p "$PROJECT_ROOT/app/(os)/health/receptionist/register"
mkdir -p "$PROJECT_ROOT/app/(os)/health/receptionist/checkin"
mkdir -p "$PROJECT_ROOT/app/(os)/health/receptionist/queue"

cp "$SCRIPT_DIR/app/(os)/health/ambulance/dispatches/index.tsx" "$PROJECT_ROOT/app/(os)/health/ambulance/dispatches/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/ambulance/location/index.tsx" "$PROJECT_ROOT/app/(os)/health/ambulance/location/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/ambulance/log/index.tsx" "$PROJECT_ROOT/app/(os)/health/ambulance/log/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/receptionist/register/index.tsx" "$PROJECT_ROOT/app/(os)/health/receptionist/register/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/receptionist/checkin/index.tsx" "$PROJECT_ROOT/app/(os)/health/receptionist/checkin/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/receptionist/queue/index.tsx" "$PROJECT_ROOT/app/(os)/health/receptionist/queue/index.tsx"

echo "✅ Batch 6 installed: Ambulance (Dispatches, Location, Log) + Receptionist (Register, CheckIn, Queue)"
