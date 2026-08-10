#!/bin/bash
# MTAA OS Education Module — Phase 1 Cleanup Script
# Removes duplicate dashboard files (root vs entry/ duplicates)
# Run from ~/MTAA_OS_V10 root

echo "=== Education Module Duplicate Cleanup ==="
echo ""

# These are the DUPLICATE files — root versions are kept, entry/ versions removed
# because root versions are imported by the router and are the canonical sources

delete_if_exists() {
  if [ -f "$1" ]; then
    rm "$1"
    echo "  DELETED: $1"
  else
    echo "  SKIP (not found): $1"
  fi
}

echo "[1/8] Removing duplicate student dashboard..."
delete_if_exists "app/(education)/entry/dashboards/student-dashboard.tsx"

echo "[2/8] Removing duplicate teacher dashboard..."
delete_if_exists "app/(education)/entry/dashboards/teacher-dashboard.tsx"

echo "[3/8] Removing duplicate parent dashboard..."
delete_if_exists "app/(education)/entry/dashboards/parent-dashboard.tsx"

echo "[4/8] Removing duplicate admin dashboard..."
delete_if_exists "app/(education)/entry/dashboards/admin-dashboard.tsx"

echo "[5/8] Removing duplicate head-teacher dashboard..."
delete_if_exists "app/(education)/entry/dashboards/head-teacher-dashboard.tsx"

echo "[6/8] Removing duplicate accountant dashboard..."
delete_if_exists "app/(education)/entry/dashboards/accountant-dashboard.tsx"

echo "[7/8] Removing duplicate staff dashboard..."
delete_if_exists "app/(education)/entry/dashboards/staff-dashboard.tsx"

echo "[8/8] Removing duplicate entry index (dashboard.tsx handles this)..."
delete_if_exists "app/(education)/entry/index.tsx"

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Copy fixed files from the ZIP to app/(education)/"
echo "  2. Create app/(education)/emergency/roll-call.tsx (provided in ZIP)"
echo "  3. Run: npx tsc --noEmit to check for type errors"
echo "  4. Run: npx expo start -c to clear cache and test"
