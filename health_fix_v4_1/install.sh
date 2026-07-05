#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "=========================================="
echo "MTAA Health OS v4.1 Fix Installer"
echo "=========================================="
echo ""
echo "[1/4] Backing up existing files..."
mkdir -p backups
cp ../lib/health/services/health-role.service.ts backups/ 2>/dev/null || true
cp ../lib/health/hooks/useHealthRole.ts backups/ 2>/dev/null || true
cp ../app/\(os\)/health/system/roles/index.tsx backups/ 2>/dev/null || true
echo "[2/4] Installing updated service file..."
cp health-role.service.ts ../lib/health/services/health-role.service.ts
echo "[3/4] Installing updated hook file..."
cp useHealthRole.ts ../lib/health/hooks/useHealthRole.ts
echo "[4/4] Installing updated Staff Management screen..."
cp roles_index.tsx ../app/\(os\)/health/system/roles/index.tsx
echo ""
echo "=== VERIFICATION ==="
grep -n "rpc.*health_get_primary_staff_record" ../lib/health/services/health-role.service.ts && echo "  ✅ RPC" || echo "  ❌ RPC missing"
grep -n "clockIn" ../lib/health/services/health-role.service.ts && echo "  ✅ clockIn" || echo "  ❌ clockIn missing"
grep -n "clockOut" ../lib/health/services/health-role.service.ts && echo "  ✅ clockOut" || echo "  ❌ clockOut missing"
grep -n "getAllStaffForSystemAdmin" ../lib/health/services/health-role.service.ts && echo "  ✅ getAllStaffForSystemAdmin" || echo "  ❌ Missing"
grep -n "getStaffStats" ../lib/health/services/health-role.service.ts && echo "  ✅ getStaffStats" || echo "  ❌ Missing"
grep -n "getCurrentUserRole" ../lib/health/hooks/useHealthRole.ts && echo "  ✅ Hook" || echo "  ❌ Hook broken"
grep -n "getAllStaffForSystemAdmin" ../app/\(os\)/health/system/roles/index.tsx && echo "  ✅ Roles screen" || echo "  ❌ Roles screen broken"
echo ""
echo "=========================================="
echo "DONE. Now run the SQL in Supabase."
echo "=========================================="
