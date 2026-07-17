#!/bin/bash
# MTAA OS V10 — Cleanup corrupted files from terminal paste disaster
# Run this BEFORE extracting the fix package

echo "=== MTAA OS V10 Cleanup Script ==="
echo "Removing corrupted files and backup folders..."

cd ~/MTAA_OS_V10

# 1. Remove corrupted mtruck backup folders (XML error responses)
echo "[1/5] Removing corrupted mtruck backup folders..."
rm -rf lib/mtruck.backup.1783634956
rm -rf lib/mtruck.backup.1783635560
echo "  Done."

# 2. Remove any other .backup.* folders
echo "[2/5] Removing all .backup.* folders..."
find . -type d -name "*.backup.*" -exec rm -rf {} + 2>/dev/null
echo "  Done."

# 3. Remove corrupted files that got shell commands pasted into them
echo "[3/5] Removing corrupted source files..."
rm -f lib/health/hooks/index.ts
rm -f domains/education/services/feedService.ts
rm -f domains/pulse/services/pulseService_posts.ts
rm -f lib/hooks/use-notification.ts
rm -f lib/hooks/useNotifications.ts
rm -f lib/services/health-service.ts
rm -f lib/services/obd-diagnostic.service.ts
rm -f lib/mtruck/core/mtruck-live-os-loop.ts
rm -f lib/mtruck/realtime/fleet-realtime-worker.ts
rm -f wallet/deposit.tsx
echo "  Done."

# 4. Remove any files that contain shell command fragments
echo "[4/5] Scanning for other corrupted files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \)   -exec grep -l "2>/dev/null || echo" {} \; 2>/dev/null | while read f; do
  echo "  Removing corrupted: $f"
  rm -f "$f"
done
echo "  Done."

# 5. Fix TransportAdminScreen.tsx missing parens with sed
echo "[5/5] Fixing TransportAdminScreen.tsx syntax..."
if [ -f "domains/education/pages/TransportAdminScreen.tsx" ]; then
  # Fix missing )) in setRouteForm and setPsvForm calls
  sed -i 's/setRouteForm(p => ({ \.\.\.p, route_name: v })})/setRouteForm(p => ({ ...p, route_name: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setRouteForm(p => ({ \.\.\.p, route_code: v })})/setRouteForm(p => ({ ...p, route_code: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setRouteForm(p => ({ \.\.\.p, description: v })})/setRouteForm(p => ({ ...p, description: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setRouteForm(p => ({ \.\.\.p, max_students: v })})/setRouteForm(p => ({ ...p, max_students: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setRouteForm(p => ({ \.\.\.p, registration_fee: v })})/setRouteForm(p => ({ ...p, registration_fee: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setRouteForm(p => ({ \.\.\.p, monthly_fee: v })})/setRouteForm(p => ({ ...p, monthly_fee: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setRouteForm(p => ({ \.\.\.p, morning_pickup_time: v })})/setRouteForm(p => ({ ...p, morning_pickup_time: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setRouteForm(p => ({ \.\.\.p, afternoon_dropoff_time: v })})/setRouteForm(p => ({ ...p, afternoon_dropoff_time: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, full_name: v })})/setPsvForm(p => ({ ...p, full_name: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, phone: v })})/setPsvForm(p => ({ ...p, phone: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, license_number: v })})/setPsvForm(p => ({ ...p, license_number: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, license_expiry: v })})/setPsvForm(p => ({ ...p, license_expiry: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, vehicle_plate: v })})/setPsvForm(p => ({ ...p, vehicle_plate: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, vehicle_model: v })})/setPsvForm(p => ({ ...p, vehicle_model: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, vehicle_color: v })})/setPsvForm(p => ({ ...p, vehicle_color: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, vehicle_capacity: v })})/setPsvForm(p => ({ ...p, vehicle_capacity: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, insurance_number: v })})/setPsvForm(p => ({ ...p, insurance_number: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  sed -i 's/setPsvForm(p => ({ \.\.\.p, insurance_expiry: v })})/setPsvForm(p => ({ ...p, insurance_expiry: v }))}/g' domains/education/pages/TransportAdminScreen.tsx
  echo "  Fixed TransportAdminScreen.tsx"
else
  echo "  TransportAdminScreen.tsx not found, will be in fix package"
fi

echo ""
echo "=== Cleanup Complete ==="
echo "Now extract the fix package:"
echo "  unzip ~/Downloads/mtaa_ts_error_fix.zip -d ~/MTAA_OS_V10"
