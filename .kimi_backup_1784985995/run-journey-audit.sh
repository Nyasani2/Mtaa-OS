#!/bin/bash
# run-journey-audit.sh — Full user journey audit
cd ~/MTAA_OS_V10
set -e

echo "=== MTAA OS V10 USER JOURNEY AUDIT ==="
echo ""

node scripts/journey-audit.js

echo ""
echo "=== GENERATING FIX PLAN ==="
node scripts/journey-fix.js

echo ""
echo "=== DONE ==="
