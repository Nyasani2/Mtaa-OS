#!/bin/bash
# run-auto-fix.sh — Fix uncaught errors with safety checks
cd ~/MTAA_OS_V10

echo "=== MTAA OS V10 UNCAUGHT ERRORS AUTO-FIX ==="
echo ""
echo "Step 1: DRY RUN (preview changes)"
node scripts/auto-fix-uncaught-errors.js --dry-run

echo ""
read -p "Apply fixes? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Step 2: APPLYING FIXES"
  node scripts/auto-fix-uncaught-errors.js
  echo ""
  echo "Step 3: VERIFY"
  npx tsc --noEmit 2>&1 | grep "^app/" | wc -l | xargs echo "TypeScript errors in app/:"
  npx tsc --noEmit 2>&1 | grep "^lib/" | wc -l | xargs echo "TypeScript errors in lib/:"
else
  echo "Cancelled. No files modified."
fi
