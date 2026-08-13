#!/bin/bash
# MTAA OS V10 — Option A: Config-First Quick Fix
# Run from ~/MTAA_OS_V10 project root

set -e

echo "=========================================="
echo "MTAA OS V10 — Option A: Config-First Fix"
echo "=========================================="
echo ""

# Backup existing tsconfig
if [ -f "tsconfig.json" ]; then
    cp tsconfig.json tsconfig.json.backup.$(date +%Y%m%d_%H%M%S)
    echo "[1/3] Backed up existing tsconfig.json"
else
    echo "[1/3] No existing tsconfig.json found — creating fresh"
fi

# Copy new tsconfig
cp tsconfig.json.new tsconfig.json
echo "[2/3] Applied new tsconfig.json"

# Verify
echo "[3/3] Running TypeScript check..."
npx tsc --noEmit 2>&1 | tail -20

echo ""
echo "=========================================="
echo "Done! Review errors above."
echo "=========================================="
echo ""
echo "What changed:"
echo "  • module: esnext  (fixes dynamic imports)"
echo "  • Excluded dead folders:"
echo "      archive/, mtaxi-operations/, mtaxi-complete/"
echo "      transport_audit_fix_v2/, apps/_legacy_components/"
echo "      appstore/, civic_routes/, manifests/"
echo "      supabase/functions/"
echo ""
echo "Expected reduction: ~70 errors from exclusions + ~11 from module fix"
echo ""
echo "Next: Run Option B (Root-Cause Blitz) to fix the remaining ~500."
