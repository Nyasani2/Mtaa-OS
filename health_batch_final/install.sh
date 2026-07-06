#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Health OS Final Batch: Biometric + Book Appointment + Layouts + SQL ==="
echo "Installing files..."

# Biometric hook
mkdir -p "$PROJECT_ROOT/lib/health/hooks"
cp "$SCRIPT_DIR/lib/health/hooks/useBiometricClockIn.ts" "$PROJECT_ROOT/lib/health/hooks/useBiometricClockIn.ts"

# Updated service
cp "$SCRIPT_DIR/lib/health/services/health-role.service.ts" "$PROJECT_ROOT/lib/health/services/health-role.service.ts"

# Book appointment
mkdir -p "$PROJECT_ROOT/app/(os)/health/appointments/book"
cp "$SCRIPT_DIR/app/(os)/health/appointments/book/index.tsx" "$PROJECT_ROOT/app/(os)/health/appointments/book/index.tsx"

# Layouts
mkdir -p "$PROJECT_ROOT/app/(os)/health/hr"
mkdir -p "$PROJECT_ROOT/app/(os)/health/accountant"
mkdir -p "$PROJECT_ROOT/app/(os)/health/ambulance"
mkdir -p "$PROJECT_ROOT/app/(os)/health/receptionist"
mkdir -p "$PROJECT_ROOT/app/(os)/health/accounting"
mkdir -p "$PROJECT_ROOT/app/(os)/health/billing"
mkdir -p "$PROJECT_ROOT/app/(os)/health/emergency"
mkdir -p "$PROJECT_ROOT/app/(os)/health/reception"

cp "$SCRIPT_DIR/app/(os)/health/hr/_layout.tsx" "$PROJECT_ROOT/app/(os)/health/hr/_layout.tsx"
cp "$SCRIPT_DIR/app/(os)/health/accountant/_layout.tsx" "$PROJECT_ROOT/app/(os)/health/accountant/_layout.tsx"
cp "$SCRIPT_DIR/app/(os)/health/ambulance/_layout.tsx" "$PROJECT_ROOT/app/(os)/health/ambulance/_layout.tsx"
cp "$SCRIPT_DIR/app/(os)/health/receptionist/_layout.tsx" "$PROJECT_ROOT/app/(os)/health/receptionist/_layout.tsx"

# Index redirects
cp "$SCRIPT_DIR/app/(os)/health/accounting/index.tsx" "$PROJECT_ROOT/app/(os)/health/accounting/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/billing/index.tsx" "$PROJECT_ROOT/app/(os)/health/billing/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/emergency/index.tsx" "$PROJECT_ROOT/app/(os)/health/emergency/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/hr/index.tsx" "$PROJECT_ROOT/app/(os)/health/hr/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/reception/index.tsx" "$PROJECT_ROOT/app/(os)/health/reception/index.tsx"

echo "✅ Final batch installed:"
echo "   - Biometric clock-in hook (useBiometricClockIn.ts)"
echo "   - Updated health-role.service.ts with biometric methods"
echo "   - Book Appointment screen (/health/appointments/book)"
echo "   - Layout files for hr, accountant, ambulance, receptionist"
echo "   - Index redirects for accounting, billing, emergency, hr, reception"
echo ""
echo "⚠️  IMPORTANT: Run the SQL in Supabase SQL Editor BEFORE starting the app:"
echo "   $SCRIPT_DIR/01_health_final_sql.sql"
echo ""
echo "This SQL creates:"
echo "   - Biometric clock-in/clock-out RPCs"
echo "   - All new tables (attendance, shifts, leave, payroll, budget, revenue, procurement, tax, compliance, ambulance vehicles/dispatches/logs, patients, check-ins, appointments)"
echo "   - RLS policies for all new tables"
echo "   - Performance indexes"
