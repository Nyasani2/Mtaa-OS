#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Health OS Batch 5: HR + Accountant Screens ==="
echo "Installing 9 files..."

mkdir -p "$PROJECT_ROOT/app/(os)/health/hr/payroll"
mkdir -p "$PROJECT_ROOT/app/(os)/health/hr/attendance"
mkdir -p "$PROJECT_ROOT/app/(os)/health/hr/shifts"
mkdir -p "$PROJECT_ROOT/app/(os)/health/hr/leave"
mkdir -p "$PROJECT_ROOT/app/(os)/health/accountant/revenue"
mkdir -p "$PROJECT_ROOT/app/(os)/health/accountant/budget"
mkdir -p "$PROJECT_ROOT/app/(os)/health/accountant/procurement"
mkdir -p "$PROJECT_ROOT/app/(os)/health/accountant/tax"
mkdir -p "$PROJECT_ROOT/app/(os)/health/accountant/compliance"

cp "$SCRIPT_DIR/app/(os)/health/hr/payroll/index.tsx" "$PROJECT_ROOT/app/(os)/health/hr/payroll/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/hr/attendance/index.tsx" "$PROJECT_ROOT/app/(os)/health/hr/attendance/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/hr/shifts/index.tsx" "$PROJECT_ROOT/app/(os)/health/hr/shifts/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/hr/leave/index.tsx" "$PROJECT_ROOT/app/(os)/health/hr/leave/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/accountant/revenue/index.tsx" "$PROJECT_ROOT/app/(os)/health/accountant/revenue/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/accountant/budget/index.tsx" "$PROJECT_ROOT/app/(os)/health/accountant/budget/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/accountant/procurement/index.tsx" "$PROJECT_ROOT/app/(os)/health/accountant/procurement/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/accountant/tax/index.tsx" "$PROJECT_ROOT/app/(os)/health/accountant/tax/index.tsx"
cp "$SCRIPT_DIR/app/(os)/health/accountant/compliance/index.tsx" "$PROJECT_ROOT/app/(os)/health/accountant/compliance/index.tsx"

echo "✅ Batch 5 installed: HR (Payroll, Attendance, Shifts, Leave) + Accountant (Revenue, Budget, Procurement, Tax, Compliance)"
