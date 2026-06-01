#!/bin/bash
cd ~/MTAA_OS_V10

echo "========================================"
echo "  MTAA EXPO PACKAGE PROACTIVE SCAN"
echo "========================================"
echo ""

echo "=== SCANNING ALL EXPO IMPORTS IN SOURCE CODE ==="
# Find all expo-* imports across source directories (excluding node_modules)
find app/ lib/ domains/ hooks/ components/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null | \
  xargs grep -h "from ['\"]expo-" 2>/dev/null | \
  sed "s/.*from ['\"]\(expo-[^'\"]*\)['\"].*/\1/" | \
  sort | uniq > /tmp/expo_imports.txt

echo "=== EXPO PACKAGES REFERENCED IN SOURCE CODE ==="
cat /tmp/expo_imports.txt

echo ""
echo "=== EXPO PACKAGES INSTALLED IN node_modules ==="
ls node_modules/ | grep "^expo-" | sort > /tmp/expo_installed.txt
cat /tmp/expo_installed.txt

echo ""
echo "=== MISSING PACKAGES (referenced but NOT installed) ==="
comm -23 /tmp/expo_imports.txt /tmp/expo_installed.txt > /tmp/expo_missing.txt
if [ -s /tmp/expo_missing.txt ]; then
    cat /tmp/expo_missing.txt
    echo ""
    echo "=== INSTALL COMMAND ==="
    echo "npm install $(cat /tmp/expo_missing.txt | tr '\n' ' ') --save"
else
    echo "ALL EXPO PACKAGES ARE INSTALLED ✓"
fi

echo ""
echo "=== EXTRA PACKAGES (installed but NOT referenced) ==="
comm -13 /tmp/expo_imports.txt /tmp/expo_installed.txt
