#!/bin/bash
# ASIS CSE v2 — Lint Fix Patch
# Fixes 2 remaining issues in engine files

cd ~/MTAA_OS_V10/lib/asis-cse

echo "[1/2] Fixing asis-cse-purpose-engine.ts (non-null assertion after optional chain)..."
# Line 140: this.getActiveGoal()?.priority!  ->  (this.getActiveGoal()?.priority ?? 0)
sed -i 's/this.getActiveGoal()?.priority!/(this.getActiveGoal()?.priority ?? 0)/g' asis-cse-purpose-engine.ts
echo "  Done."

echo "[2/2] Fixing asis-cse-security-engine.ts (useless length check)..."
# Line 147: missing.length > 0 && missing.some(...)  ->  missing.some(...)
sed -i 's/missing.length > 0 && missing.some/missing.some/g' asis-cse-security-engine.ts
echo "  Done."

echo ""
echo "=== Re-running lint ==="
cd ~/MTAA_OS_V10
NODE_OPTIONS=--max-old-space-size=8192 npm run lint:ox
