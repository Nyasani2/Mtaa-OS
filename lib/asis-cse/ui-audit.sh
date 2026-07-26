#!/bin/bash
# MTAA OS — Full UI Screen Audit
# Checks all app screens for common runtime errors

cd ~/MTAA_OS_V10

echo "══════════════════════════════════════════════════"
echo "  MTAA OS UI SCREEN AUDIT"
echo "══════════════════════════════════════════════════"
echo ""

# 1. List all screen files
echo "[1/6] Found $(find app -name '*.tsx' -not -path '*/node_modules/*' | wc -l) screen files"
echo ""

# 2. Check for missing React Native imports (common cause of crashes)
echo "[2/6] Checking for missing React Native imports..."
for f in $(find app -name '*.tsx' -not -path '*/node_modules/*'); do
  # Check if file uses JSX elements but doesn't import them
  if grep -q '<View\|<Text\|<TouchableOpacity\|<ScrollView\|<SafeAreaView' "$f" 2>/dev/null; then
    if ! grep -q "from 'react-native'" "$f" 2>/dev/null; then
      echo "  ⚠️  MISSING react-native import: $f"
    fi
  fi
done
echo ""

# 3. Check for useWalletStore vs useWallet mismatches
echo "[3/6] Checking wallet hook mismatches..."
grep -rn "useWalletStore" app/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "lib/modules/wallet" | grep -v "node_modules" | while read line; do
  echo "  ⚠️  useWalletStore import: $line"
done
echo ""

# 4. Check for undefined variables in JSX (common after refactors)
echo "[4/6] Checking for undefined JSX variables..."
find app -name '*.tsx' -not -path '*/node_modules/*' -exec grep -l "is not defined\|Cannot find name\|ReferenceError" {} \; 2>/dev/null | while read f; do
  echo "  ⚠️  Potential undefined refs: $f"
done
echo ""

# 5. Check for old ASIS provider imports
echo "[5/6] Checking for old ASIS provider imports..."
grep -rn "asis-provider-v5\|asis-provider-v6\|useASISv5\|useASISv6" app/ lib/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".bak" | while read line; do
  echo "  ⚠️  Old ASIS import: $line"
done
echo ""

# 6. TypeScript check on app directory only
echo "[6/6] Running TypeScript check on app screens..."
npx tsc --noEmit --project tsconfig.json 2>&1 | grep -E "error TS|app/" | head -30
echo ""

echo "══════════════════════════════════════════════════"
echo "  Audit Complete"
echo "══════════════════════════════════════════════════"
