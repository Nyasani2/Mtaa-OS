#!/bin/bash
# cleanup-broken-lib.sh — Deletes dead files + applies fixes
cd ~/MTAA_OS_V10
set -e

echo "=== CLEANING BROKEN LIB FILES ==="

# Delete pulse manifest (module is gone)
if [ -f "manifests/pulse_manifest.ts" ]; then
  rm -f manifests/pulse_manifest.ts
  echo "  ✅ Deleted manifests/pulse_manifest.ts"
fi

# Delete empty/broken manifest dir if empty
if [ -d "manifests" ] && [ -z "$(ls -A manifests 2>/dev/null)" ]; then
  rmdir manifests
  echo "  ✅ Removed empty manifests/ dir"
fi

# Delete DELETE_THIS_FILE.txt
rm -f DELETE_THIS_FILE.txt

echo ""
echo "=== VERIFY ==="
echo "TypeScript errors remaining:"
npx tsc --noEmit 2>&1 | grep "^lib/" | wc -l
echo ""
echo "=== DONE ==="
