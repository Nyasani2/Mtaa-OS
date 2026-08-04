#!/bin/bash
# cleanup_mtaa_gaps.sh
# Removes ALL files introduced by the missing gaps batch
# Run from ~/MTAA_OS_V10

echo "Removing all gap-fill files..."

# Route files (all from missing gaps batch)
rm -f "app/(admin)/_layout.tsx"
rm -f "app/(admin)/index.tsx"
rm -rf "app/(admin)/system"
rm -f "app/(education)/portal/index.tsx"
rm -rf "app/(education)/portal"
rm -f "app/(education)/results/index.tsx"
rm -rf "app/(education)/results"
rm -f "app/(os)/jobs.tsx"
rm -f "app/(os)/jobs/index.tsx"
rm -rf "app/(os)/jobs"
rm -f "app/(os)/binance/index.tsx"
rm -rf "app/(os)/binance"
rm -f "app/(os)/boda/index.tsx"
rm -rf "app/(os)/boda"
rm -f "app/(os)/camera/index.tsx"
rm -rf "app/(os)/camera"
rm -f "app/(os)/civic/index.tsx"
rm -rf "app/(os)/civic"
rm -f "app/(os)/command-center/index.tsx"
rm -rf "app/(os)/command-center"
rm -f "app/(os)/courts/index.tsx"
rm -rf "app/(os)/courts"
rm -f "app/(os)/credit/index.tsx"
rm -rf "app/(os)/credit"
rm -f "app/(os)/education/index.tsx"
rm -rf "app/(os)/education"
rm -f "app/(os)/emergency/index.tsx"
rm -rf "app/(os)/emergency"
rm -f "app/(os)/gallery/index.tsx"
rm -rf "app/(os)/gallery"
rm -f "app/(os)/head-teacher/index.tsx"
rm -rf "app/(os)/head-teacher"
rm -f "app/(os)/health/pharmacy/inventory.tsx"
rm -f "app/(os)/marketplace/index.tsx"
rm -rf "app/(os)/marketplace"
rm -f "app/(os)/mtaxi/index.tsx"
rm -rf "app/(os)/mtaxi"
rm -f "app/(os)/mtruck/index.tsx"
rm -rf "app/(os)/mtruck"
rm -f "app/(os)/music/index.tsx"
rm -rf "app/(os)/music"
rm -f "app/(os)/podcast/index.tsx"
rm -rf "app/(os)/podcast"
rm -f "app/(os)/police/index.tsx"
rm -rf "app/(os)/police"
rm -f "app/(os)/prisons/index.tsx"
rm -rf "app/(os)/prisons"
rm -f "app/(os)/schools/index.tsx"
rm -rf "app/(os)/schools"
rm -f "app/(os)/shop/index.tsx"
rm -rf "app/(os)/shop"
rm -f "app/(os)/teachers/index.tsx"
rm -rf "app/(os)/teachers"
rm -f "app/(os)/timetable/index.tsx"
rm -rf "app/(os)/timetable"
rm -f "app/(os)/transport/index.tsx"
rm -rf "app/(os)/transport"
rm -f "app/(os)/video/index.tsx"
rm -rf "app/(os)/video"
rm -f "app/(work)/tasks/index.tsx"
rm -rf "app/(work)/tasks"
rm -f "app/(work)/workspace/index.tsx"
rm -rf "app/(work)/workspace"

# Service barrels
rm -f "lib/services/tribes.ts"
rm -rf "lib/services/tribes"
rm -f "lib/services/streets.ts"
rm -rf "lib/services/streets"
rm -f "lib/services/garage.ts"
rm -rf "lib/services/garage"

# Health services
rm -f "lib/services/health/staff-service.ts"
rm -f "lib/services/health/hospital-admin.ts"
rm -f "lib/services/health/index.ts"
rm -rf "lib/services/health"

# Hooks
rm -f "lib/hooks/useTribes.ts"
rm -f "lib/hooks/useHealthStaff.ts"
rm -f "lib/hooks/useHospitalAdmin.ts"

# Registry / Manifest
rm -f "lib/app-registry.ts"
rm -f "lib/apps/manifest.ts"
rm -f "lib/apps/index.ts"

echo "Cleanup complete."
echo ""
echo "Verifying no gap-fill files remain..."

# Verify nothing remains
FOUND=0
for f in \
  "app/(admin)/_layout.tsx" \
  "app/(os)/jobs.tsx" \
  "app/(os)/health/pharmacy/inventory.tsx" \
  "lib/app-registry.ts" \
  "lib/hooks/useTribes.ts" \
  "lib/services/tribes.ts" \
  "lib/services/health/staff-service.ts"; do
  if [ -f "$f" ]; then
    echo "  STILL EXISTS: $f"
    FOUND=1
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "  All gap-fill files removed successfully."
else
  echo "  WARNING: Some files still exist (see above)."
fi
