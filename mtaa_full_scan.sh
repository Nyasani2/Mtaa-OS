#!/bin/bash
cd ~/MTAA_OS_V10

echo "========================================"
echo "  MTAA FULL DEPENDENCY PROACTIVE SCAN"
echo "========================================"
echo ""

echo "=== SCANNING ALL IMPORTS IN SOURCE CODE ==="
find app/ lib/ domains/ hooks/ components/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null | \
  xargs grep -h "from ['\"]" 2>/dev/null | \
  sed "s/.*from ['\"]\([^'\"./@][^'\"]*\)['\"].*/\1/" | \
  grep -v "^react$" | grep -v "^react-native$" | grep -v "^expo" | \
  grep -v "^@/" | grep -v "^@types" | \
  sort | uniq > /tmp/all_imports.txt

echo "=== NON-EXPO/NON-REACT PACKAGES REFERENCED ==="
cat /tmp/all_imports.txt

echo ""
echo "=== CHECKING WHICH ARE MISSING ==="
> /tmp/all_missing.txt
while read pkg; do
    # Extract base package name (before /)
    base_pkg=$(echo "$pkg" | cut -d'/' -f1)
    if [ ! -d "node_modules/$base_pkg" ]; then
        echo "$base_pkg (from import: $pkg)" >> /tmp/all_missing.txt
    fi
done < /tmp/all_imports.txt

if [ -s /tmp/all_missing.txt ]; then
    cat /tmp/all_missing.txt
    echo ""
    echo "=== INSTALL COMMAND ==="
    cut -d' ' -f1 /tmp/all_missing.txt | sort -u | tr '\n' ' ' | xargs -I {} echo "npm install {} --save"
else
    echo "ALL NON-EXPO PACKAGES ARE INSTALLED ✓"
fi
