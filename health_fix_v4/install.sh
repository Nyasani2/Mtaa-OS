#!/bin/bash
set -e

echo "=========================================="
echo "MTAA Health OS v4 Final Fix Installer"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Backup existing files
echo "[1/5] Backing up existing files..."
mkdir -p backups
cp ../lib/health/services/health-role.service.ts backups/health-role.service.ts.bak.$(date +%s) 2>/dev/null || true
cp ../lib/health/hooks/useHealthRole.ts backups/useHealthRole.ts.bak.$(date +%s) 2>/dev/null || true
cp ../app/\(os\)/health/system/roles/index.tsx backups/roles-index.tsx.bak.$(date +%s) 2>/dev/null || true

# Install new files
echo "[2/5] Installing updated service file..."
cp health-role.service.ts ../lib/health/services/health-role.service.ts

echo "[3/5] Installing updated hook file..."
cp useHealthRole.ts ../lib/health/hooks/useHealthRole.ts

echo "[4/5] Installing updated Staff Management screen..."
cp roles_index.tsx ../app/\(os\)/health/system/roles/index.tsx

echo "[5/5] Verifying installation..."
echo ""
echo "=== VERIFICATION ==="
echo ""

echo "Service file RPC check:"
grep -n "rpc.*health_get_primary_staff_record" ../lib/health/services/health-role.service.ts && echo "  ✅ Service uses RPC" || echo "  ❌ Service missing RPC"

echo ""
echo "Service file getAllStaffForSystemAdmin check:"
grep -n "getAllStaffForSystemAdmin" ../lib/health/services/health-role.service.ts && echo "  ✅ Service has system admin function" || echo "  ❌ Missing system admin function"

echo ""
echo "Service file getStaffStats check:"
grep -n "getStaffStats" ../lib/health/services/health-role.service.ts && echo "  ✅ Service has stats function" || echo "  ❌ Missing stats function"

echo ""
echo "Hook file check:"
grep -n "getCurrentUserRole" ../lib/health/hooks/useHealthRole.ts && echo "  ✅ Hook calls service" || echo "  ❌ Hook broken"

echo ""
echo "Roles screen check:"
grep -n "getAllStaffForSystemAdmin" ../app/\(os\)/health/system/roles/index.tsx && echo "  ✅ Screen calls global admin function" || echo "  ❌ Screen missing global admin call"
grep -n "getStaffStats" ../app/\(os\)/health/system/roles/index.tsx && echo "  ✅ Screen calls stats function" || echo "  ❌ Screen missing stats call"

echo ""
echo "=========================================="
echo "Installation complete!"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Run the SQL in Supabase SQL Editor:"
echo "   - Open Supabase Dashboard → SQL Editor"
echo "   - Paste contents of 01_health_v4_schema_fix.sql"
echo "   - Click Run"
echo ""
echo "2. Clear Metro cache and restart:"
echo "   pkill -f expo && pkill -f node && sleep 3"
echo "   rm -rf .expo node_modules/.cache"
echo "   npx expo start --web --clear"
echo ""
echo "3. Test the Health OS:"
echo "   - Badge should show 'System Admin' (not 'Patient')"
echo "   - Staff Management should show ALL staff with real counts"
echo "   - No more 'specialization' column errors"
echo ""
