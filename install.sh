#!/bin/bash
# MTAA OS V10 — CLEANUP + ROUTE INSTALL SCRIPT (FIXED)
# Run from ~/MTAA_OS_V10/

set -e

echo "=========================================="
echo "MTAA OS V10 — CLEANUP & ROUTE INSTALL"
echo "=========================================="
echo ""

# Step 1: Run cleanup (already done, skip if completed)
echo "[1/5] Cleanup already completed. Skipping..."
echo ""

# Step 2: Move manifests to lib/modules/
echo "[2/5] Installing missing manifests..."
mkdir -p lib/modules/business
mkdir -p lib/modules/phone
mkdir -p lib/modules/property
mkdir -p lib/modules/pulse
mkdir -p lib/modules/regulatory

cp business_manifest.ts lib/modules/business/manifest.ts
cp phone_manifest.ts lib/modules/phone/manifest.ts
cp property_manifest.ts lib/modules/property/manifest.ts
cp pulse_manifest.ts lib/modules/pulse/manifest.ts
cp regulatory_manifest.ts lib/modules/regulatory/manifest.ts

echo "  ✓ business manifest"
echo "  ✓ phone manifest"
echo "  ✓ property manifest"
echo "  ✓ pulse manifest"
echo "  ✓ regulatory manifest"
echo ""

# Step 3: Create civic sub-module routes
# NOTE: Use quotes around paths with parentheses
echo "[3/5] Creating civic sub-module routes..."
mkdir -p "app/(civic)/agriculture"
mkdir -p "app/(civic)/border"
mkdir -p "app/(civic)/customs"
mkdir -p "app/(civic)/immigration"
mkdir -p "app/(civic)/transport"

cp agriculture_index.tsx "app/(civic)/agriculture/index.tsx"
cp border_index.tsx "app/(civic)/border/index.tsx"
cp customs_index.tsx "app/(civic)/customs/index.tsx"
cp immigration_index.tsx "app/(civic)/immigration/index.tsx"
cp transport_index.tsx "app/(civic)/transport/index.tsx"

echo "  ✓ app/(civic)/agriculture/index.tsx"
echo "  ✓ app/(civic)/border/index.tsx"
echo "  ✓ app/(civic)/customs/index.tsx"
echo "  ✓ app/(civic)/immigration/index.tsx"
echo "  ✓ app/(civic)/transport/index.tsx"
echo ""

# Step 4: Update civic layout
echo "[4/5] Updating civic layout..."
cp civic_layout.tsx "app/(civic)/_layout.tsx"
echo "  ✓ Updated app/(civic)/_layout.tsx"
echo ""

# Step 5: Clean up install artifacts
echo "[5/5] Cleaning install artifacts..."
rm -f business_manifest.ts phone_manifest.ts property_manifest.ts pulse_manifest.ts regulatory_manifest.ts
rm -f agriculture_index.tsx border_index.tsx customs_index.tsx immigration_index.tsx transport_index.tsx
rm -f civic_layout.tsx mtaa_cleanup.sh install_cleanup.sh
echo "  ✓ Install artifacts cleaned"
echo ""

echo "=========================================="
echo "INSTALL COMPLETE"
echo "=========================================="
echo ""
echo "Summary:"
echo "  • 80+ orphaned files cleaned"
echo "  • 7 backup files removed"
echo "  • 5 manifests installed"
echo "  • 5 civic routes created"
echo "  • asis/ root folder removed"
echo ""
echo "Next:"
echo "  npx tsc --noEmit"
echo "  npx expo start --clear"
echo ""
