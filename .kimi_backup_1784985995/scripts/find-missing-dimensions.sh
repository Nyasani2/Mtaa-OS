#!/bin/bash
# Find all files that use SCREEN_W but don't import Dimensions
cd ~/MTAA_OS_V10

echo "=== Files using SCREEN_W ==="
grep -rln "SCREEN_W" app/ lib/ --include="*.tsx" --include="*.ts" 2>/dev/null

echo ""
echo "=== Files using SCREEN_W WITHOUT Dimensions import ==="
for file in $(grep -rln "SCREEN_W" app/ lib/ --include="*.tsx" --include="*.ts" 2>/dev/null); do
  if ! grep -q "Dimensions" "$file"; then
    echo "MISSING IMPORT: $file"
  fi
done
