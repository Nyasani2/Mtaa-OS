#!/bin/bash
set -e

echo "========================================"
echo "  MTAA Health OS Complete Fix V2"
echo "========================================"

PROJECT_ROOT="$PWD"

echo "[1/6] Backing up existing files..."
for f in lib/health/hooks/useHealthRole.ts lib/health/hooks/useAppointments.ts lib/health/services/health-role.service.ts "app/(os)/health/appointments/index.tsx" "app/(os)/health/find-care/index.tsx"; do
  if [ -f "$f" ]; then
    cp "$f" "$f.bak.$(date +%s)" 2>/dev/null || true
  fi
done
echo "  Backups created"

echo "[2/6] Installing fixed hooks..."
cp lib/health/hooks/useHealthRole.ts "$PROJECT_ROOT/lib/health/hooks/useHealthRole.ts"
cp lib/health/hooks/useAppointments.ts "$PROJECT_ROOT/lib/health/hooks/useAppointments.ts"
echo "  Hooks installed"

echo "[3/6] Installing fixed services..."
cp lib/health/services/health-role.service.ts "$PROJECT_ROOT/lib/health/services/health-role.service.ts"
echo "  Services installed"

echo "[4/6] Installing fixed screens..."
cp "app/(os)/health/appointments/index.tsx" "$PROJECT_ROOT/app/(os)/health/appointments/index.tsx"
cp "app/(os)/health/find-care/index.tsx" "$PROJECT_ROOT/app/(os)/health/find-care/index.tsx"
echo "  Screens installed"

echo "[5/6] Copying SQL seed data..."
mkdir -p "$PROJECT_ROOT/sql"
cp sql/health_seed_data.sql "$PROJECT_ROOT/sql/health_seed_data.sql"
echo "  SQL seed copied"

echo "[6/6] Verifying..."
for f in lib/health/hooks/useHealthRole.ts lib/health/hooks/useAppointments.ts lib/health/services/health-role.service.ts "app/(os)/health/appointments/index.tsx" "app/(os)/health/find-care/index.tsx"; do
  if [ -f "$PROJECT_ROOT/$f" ]; then
    echo "  ✓ $f"
  else
    echo "  ✗ $f MISSING!"
  fi
done

echo ""
echo "========================================"
echo "  INSTALLATION COMPLETE"
echo "========================================"
echo ""
echo "NEXT STEPS:"
echo "1. Open Supabase SQL Editor"
echo "2. Copy ALL content from sql/health_seed_data.sql"
echo "3. Paste and RUN the entire file"
echo "4. Verify output shows counts: Facilities=5, Staff=8, etc."
echo ""
echo "5. Restart Metro:"
echo "   pkill -f 'expo' && pkill -f 'node' && sleep 2"
echo "   rm -rf .expo node_modules/.cache"
echo "   npx expo start --web --clear"
echo ""
echo "6. Open Health OS — you should see:"
echo "   - 'System Administrator' badge"
echo "   - 5 facilities in Find Care"
echo "   - Staff list in User Roles"
echo "   - Appointments with timeout + retry"
