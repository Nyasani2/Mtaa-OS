#!/bin/bash
cd ~/MTAA_OS_V10

echo "=== ASIS v3 Manual Replacement ==="
echo ""

# Stop any running expo
pkill -f "expo start" 2>/dev/null
pkill -f "node.*expo" 2>/dev/null
sleep 2

# Clear cache
rm -rf .expo
rm -rf node_modules/.cache

echo "1. Backing up old files..."
[ -f "app/(os)/asis/index.tsx" ] && cp "app/(os)/asis/index.tsx" "app/(os)/asis/index.tsx.old.$(date +%s)"
[ -f "lib/asis/core/asisV3Engine.ts" ] && cp "lib/asis/core/asisV3Engine.ts" "lib/asis/core/asisV3Engine.ts.old.$(date +%s)"
echo "   ✓ Backups created"

echo ""
echo "2. Extracting new files..."
unzip -o ~/Downloads/asis-v3-replace.zip -d ./
echo "   ✓ Files extracted"

echo ""
echo "3. Verifying..."
if grep -q "class GrowthEngine" "lib/asis/core/asisV3Engine.ts"; then
    echo "   ✓ Engine: NEW (self-contained)"
else
    echo "   ✗ Engine: Still old or broken"
fi

if grep -q "M-Theory Knowledge Network" "app/(os)/asis/index.tsx"; then
    echo "   ✓ Chat UI: NEW (M-Theory)"
else
    echo "   ✗ Chat UI: Still old"
fi

echo ""
echo "4. Starting with increased memory..."
export NODE_OPTIONS="--max-old-space-size=4096"
npx expo start --clear &

echo ""
echo "=== Done. Wait for bundler to finish, then test ASIS ==="
