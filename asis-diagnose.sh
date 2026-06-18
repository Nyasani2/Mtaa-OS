#!/bin/bash
cd ~/MTAA_OS_V10

echo "=== ASIS SCREEN CHECK ==="
if [ -f "app/(os)/asis/index.tsx" ]; then
    echo "✓ app/(os)/asis/index.tsx exists"
    echo "First 30 lines:"
    sed -n '1,30p' "app/(os)/asis/index.tsx"
else
    echo "✗ app/(os)/asis/index.tsx NOT FOUND"
fi

echo ""
echo "=== ASIS V3 ENGINE CHECK ==="
if [ -f "lib/asis/core/asisV3Engine.ts" ]; then
    echo "✓ asisV3Engine.ts exists ($(stat -c%s "lib/asis/core/asisV3Engine.ts") bytes)"
    grep -n "solveMath\|knowledgeNetwork\|growthFactor\|AsisV3Engine" "lib/asis/core/asisV3Engine.ts" | head -10
else
    echo "✗ asisV3Engine.ts NOT FOUND"
fi

echo ""
echo "=== OLD ASIS BACKUP CHECK ==="
find . -path "*/.cleanup_backup*" -name "*.ts" | wc -l
echo "backup TS files found (should not affect build)"

echo ""
echo "=== BARREL EXPORT CHECK ==="
if [ -f "lib/asis/index.ts" ]; then
    echo "✓ lib/asis/index.ts exists"
    cat "lib/asis/index.ts"
else
    echo "✗ lib/asis/index.ts NOT FOUND"
fi

echo ""
echo "=== KNOWLEDGE NETWORK SIZE ==="
if [ -f "lib/asis/network/knowledgeNetwork.ts" ]; then
    SIZE=$(stat -c%s "lib/asis/network/knowledgeNetwork.ts")
    echo "knowledgeNetwork.ts: $SIZE bytes"
    if [ $SIZE -gt 50000 ]; then
        echo "⚠ WARNING: File is large - may cause memory issues"
    fi
else
    echo "✗ knowledgeNetwork.ts NOT FOUND"
fi
