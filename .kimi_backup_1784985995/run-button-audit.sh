#!/bin/bash
# run-button-audit.sh — Full button audit + optional auto-fix
cd ~/MTAA_OS_V10
set -e

echo "=== MTAA OS V10 BUTTON AUDIT ==="
echo ""

# Step 1: Run audit
node scripts/button-audit.js

# Step 2: Show summary
echo ""
echo "=== AUDIT SUMMARY ==="
if [ -f .button_audit_report.json ]; then
  node -e "
    const r = require('./.button_audit_report.json');
    console.log('Files scanned:', r.scanned);
    console.log('CRITICAL (dead):', r.critical);
    console.log('WARNING (weak):', r.warning);
    console.log('INFO (flagged):', r.info);
    console.log('');
    console.log('Files with issues:');
    Object.keys(r.byFile).forEach(f => {
      const c = r.byFile[f].filter(i => i.severity === 'CRITICAL').length;
      const w = r.byFile[f].filter(i => i.severity === 'WARNING').length;
      if (c > 0 || w > 0) console.log('  ' + f + ' — CRITICAL:' + c + ' WARNING:' + w);
    });
  "
fi

echo ""
read -p "Auto-fix CRITICAL dead buttons? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  node scripts/button-fix.js
fi

echo ""
echo "=== DONE ==="
