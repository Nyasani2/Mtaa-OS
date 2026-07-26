#!/bin/bash
set -e
BATCH_NUM=${1:-1}
PROJECT_DIR="$HOME/MTAA_OS_V10"
OUTPUT_DIR="$HOME/Desktop"

case $BATCH_NUM in
  1)
    FILES=(
      "app/(os)/studio/video-player.tsx"
      "app/(os)/studio/live.tsx"
      "app/(os)/studio/search-results.tsx"
      "app/(os)/hookup/safety.tsx"
      "lib/profile/module-integrations/ProfileAvatar.tsx"
      "app/(os)/restaurant/reports.tsx"
      "app/(garage)/inventory/index.tsx"
      "app/(os)/health/radiology/report/index.tsx"
      "app/(os)/onboarding.tsx"
    )
    ;;
  2)
    FILES=(
      "index.tsx"
      "lib/services/health-service.ts"
      "lib/services/obd-diagnostic.service.ts"
      "lib/mtruck/realtime/fleet-realtime-worker.ts"
      "lib/mtruck/core/mtruck-live-os-loop.ts"
      "manifests/pulse_manifest.ts"
      "lib/auth/identity-provider.tsx"
      "app/(os)/health/emergency-card/index.tsx"
      "app/(os)/clock.tsx"
    )
    ;;
  3)
    FILES=(
      "supabase/functions/qr-resolve/index.ts"
      "supabase/functions/qr-execute/index.ts"
      "supabase/functions/search-operations/index.ts"
      "lib/asis-v7/engine/intent-router.ts"
      "lib/marketplace/services/regulatory.service.ts"
      "app/(os)/profile/achievements.tsx"
      "app/(education)/messages/index.tsx"
      "app/(education)/payroll/index.tsx"
      "app/(garage)/diagnostics/index.tsx"
    )
    ;;
  4)
    FILES=(
      "domains/education/components/StudentIdentityCard.tsx"
      "domains/education/components/TeacherIdentityCard.tsx"
      "lib/asis-v7/engine/nl-to-sql.ts"
      "app/(os)/health/ambulance/handover/index.tsx"
      "app/(os)/health/doctor/follow-ups/index.tsx"
      "app/(os)/health/doctor/orders/index.tsx"
      "app/(os)/health/find-care/index.tsx"
      "app/(os)/health/lab/results/index.tsx"
    )
    ;;
  *)
    echo "Unknown batch: $BATCH_NUM. Available: 1, 2, 3, 4"
    exit 1
    ;;
esac

BATCH_DIR="/tmp/batch${BATCH_NUM}"
rm -rf "$BATCH_DIR"
mkdir -p "$BATCH_DIR"

echo "📦 Extracting Batch $BATCH_NUM..."
for file in "${FILES[@]}"; do
  src="$PROJECT_DIR/$file"
  if [ -f "$src" ]; then
    mkdir -p "$BATCH_DIR/$(dirname "$file")"
    cp "$src" "$BATCH_DIR/$file"
    echo "  ✅ $file"
  else
    echo "  ❌ MISSING: $file"
  fi
done

ZIP_PATH="$OUTPUT_DIR/batch${BATCH_NUM}.zip"
cd /tmp && zip -rq "$ZIP_PATH" "batch${BATCH_NUM}"
echo ""
echo "🎉 Batch $BATCH_NUM ready: $ZIP_PATH"
echo "Upload this ZIP here for complete fixed file replacements."
