#!/bin/bash
# run-targeted-audit.sh — Targeted user journey audit (no false positives)
cd ~/MTAA_OS_V10
set -e

echo "=== MTAA OS V10 TARGETED USER JOURNEY AUDIT ==="
echo ""

node scripts/targeted-journey-audit.js

echo ""
echo "=== GENERATING TARGETED FIX PLAN ==="
node scripts/targeted-journey-fix.js

echo ""
echo "=== DONE ==="
