#!/bin/bash
# MTAA Health OS v3 Final Fix Installer
# Run this from ~/MTAA_OS_V10

set -e

echo "=========================================="
echo "MTAA Health OS v3 Final Fix Installer"
echo "=========================================="
echo ""

PROJECT="$HOME/MTAA_OS_V10"
cd "$PROJECT"

# Backup existing files
echo "[1/5] Backing up existing files..."
cp lib/health/services/health-role.service.ts lib/health/services/health-role.service.ts.bak.$(date +%s) 2>/dev/null || true
cp lib/health/hooks/useHealthRole.ts lib/health/hooks/useHealthRole.ts.bak.$(date +%s) 2>/dev/null || true
cp app/\(os\)/health/system/roles/index.tsx app/\(os\)/health/system/roles/index.tsx.bak.$(date +%s) 2>/dev/null || true

# Copy new files
echo "[2/5] Installing updated service file..."
cp health_fix_v3/health-role.service.ts lib/health/services/health-role.service.ts

echo "[3/5] Installing updated hook file..."
cp health_fix_v3/useHealthRole.ts lib/health/hooks/useHealthRole.ts

echo "[4/5] Installing updated Staff Management screen..."
cp health_fix_v3/roles_index.tsx app/\(os\)/health/system/roles/index.tsx

# Verify
echo "[5/5] Verifying installation..."
echo ""
echo "=== VERIFICATION ==="
echo ""

echo "Service file RPC check:"
grep -n "rpc.*health_get_primary_staff_record" lib/health/services/health-role.service.ts && echo "  ✅ Service uses RPC" || echo "  ❌ Service missing RPC"

echo ""
echo "Service file getAllStaffForSystemAdmin check:"
grep -n "getAllStaffForSystemAdmin" lib/health/services/health-role.service.ts && echo "  ✅ Service has system admin function" || echo "  ❌ Service missing system admin function"

echo ""
echo "Hook file check:"
grep -n "getCurrentUserRole" lib/health/hooks/useHealthRole.ts && echo "  ✅ Hook calls service" || echo "  ❌ Hook missing service call"

echo ""
echo "Roles screen check:"
grep -n "isSystemAdmin\|getAllStaffForSystemAdmin\|scopeBanner" app/\(os\)/health/system/roles/index.tsx && echo "  ✅ Screen has system admin support" || echo "  ❌ Screen missing system admin support"

echo ""
echo "=========================================="
echo "Installation complete!"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Run the SQL in Supabase:"
echo "   - Open Supabase SQL Editor"
echo "   - Paste contents of 01_health_rpc_and_rls_fix.sql"
echo "   - Click Run"
echo ""
echo "2. Clear Metro cache and restart:"
echo "   pkill -f expo && pkill -f node && sleep 3"
echo "   rm -rf .expo node_modules/.cache"
echo "   npx expo start --web --clear"
echo ""
echo "3. Test the Health OS:"
echo "   - Badge should show 'System Admin' (not 'Patient')"
echo "   - Staff Management should show ALL staff across ALL facilities"
echo "   - Stats should show real numbers (not 0/0/0)"
echo ""
