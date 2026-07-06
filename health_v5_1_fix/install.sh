#!/bin/bash
set -e

echo "=== Health OS V5.1 Fix: RLS + RPC + Service + Hook ==="
echo ""

# 1. Copy SQL fix
echo "📋 Copying SQL fix..."
cp 01_health_v5_1_rls_fix.sql ~/MTAA_OS_V10/sql/01_health_v5_1_rls_fix.sql

# 2. Backup current service
echo "💾 Backing up current service..."
cp ~/MTAA_OS_V10/lib/health/services/health-role.service.ts ~/MTAA_OS_V10/lib/health/services/health-role.service.ts.bak.$(date +%s)

# 3. Copy fixed service
echo "🔧 Installing fixed health-role.service.ts..."
cp health-role.service.ts ~/MTAA_OS_V10/lib/health/services/health-role.service.ts

# 4. Backup current hook
echo "💾 Backing up current hook..."
cp ~/MTAA_OS_V10/lib/health/hooks/useHealthRole.ts ~/MTAA_OS_V10/lib/health/hooks/useHealthRole.ts.bak.$(date +%s)

# 5. Copy fixed hook
echo "🔧 Installing fixed useHealthRole.ts..."
cp useHealthRole.ts ~/MTAA_OS_V10/lib/health/hooks/useHealthRole.ts

echo ""
echo "✅ Health OS V5.1 Fix installed!"
echo ""
echo "Next steps:"
echo "  1. Run the SQL in Supabase SQL Editor:"
echo "     sql/01_health_v5_1_rls_fix.sql"
echo ""
echo "  2. Verify the RPC functions exist:"
echo "     SELECT * FROM health_get_primary_staff_record('YOUR_USER_ID');"
echo ""
echo "  3. Test the Health OS home screen — badge should now show correct role"
echo ""
echo "  4. If badge still shows 'Patient', check:"
echo "     - Does health_staff table have a row for your user?"
echo "     - Is the role column set to 'system_admin'?"
echo "     - Run: SELECT * FROM health_staff WHERE user_id = 'YOUR_USER_ID';"
