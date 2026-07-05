#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "=========================================="
echo "MTAA Health OS v5 Role Selection Installer"
echo "=========================================="
echo ""
echo "[1/3] Backing up existing files..."
mkdir -p backups
cp ../lib/health/services/health-role.service.ts backups/ 2>/dev/null || true
cp ../lib/health/hooks/useHealthRole.ts backups/ 2>/dev/null || true
cp ../app/\(os\)/health/index.tsx backups/ 2>/dev/null || true
echo "[2/3] Installing v5 files..."
cp health-role.service.ts ../lib/health/services/health-role.service.ts
cp useHealthRole.ts ../lib/health/hooks/useHealthRole.ts
cp index.tsx ../app/\(os\)/health/index.tsx
echo "[3/3] Verifying..."
grep -q "getAllUserRoles" ../lib/health/services/health-role.service.ts && echo "  ✅ getAllUserRoles" || echo "  ❌ Missing"
grep -q "allRoles" ../lib/health/hooks/useHealthRole.ts && echo "  ✅ allRoles in hook" || echo "  ❌ Missing"
grep -q "selectRole" ../lib/health/hooks/useHealthRole.ts && echo "  ✅ selectRole in hook" || echo "  ❌ Missing"
grep -q "Role Selection" ../app/\(os\)/health/index.tsx && echo "  ✅ Role selection UI" || echo "  ❌ Missing"
grep -q "clearRoleSelection" ../app/\(os\)/health/index.tsx && echo "  ✅ Switch role support" || echo "  ❌ Missing"
echo ""
echo "=========================================="
echo "DONE. Now run the SQL additions in Supabase."
echo "=========================================="
