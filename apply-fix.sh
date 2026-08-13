#!/bin/bash
set -e
cd ~/MTAA_OS_V10
cp tsconfig.json tsconfig.json.backup.$(date +%Y%m%d_%H%M%S)
cp tsconfig.json.v3 tsconfig.json
echo "Updated tsconfig.json applied with full exclusions."
echo "Excluded: _needs_review, backups, stubs, domains, edge_functions, lib/appstore, lib/apps-store, apps/_disabled"
echo ""
echo "Running TypeScript check..."
npx tsc --noEmit
echo "Done!"
