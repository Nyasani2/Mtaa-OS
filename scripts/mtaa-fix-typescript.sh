#!/bin/bash
# ============================================================
# MTAA TypeScript Environment Fix
# Run this if `npx tsc --noEmit` fails with "command not found"
# ============================================================

cd ~/MTAA_OS_V10

echo "[1/4] Checking current TypeScript status..."
npx tsc --version 2>/dev/null || echo "NOT INSTALLED"

echo "[2/4] Installing TypeScript + React Native types..."
npm install -D typescript @types/react @types/react-native @types/react-test-renderer

echo "[3/4] Verifying tsconfig.json..."
if [ !f tsconfig.json ]; then
    echo "WARNING: No tsconfig.json found. Generating..."
    npx expo customize tsconfig.json
fi

echo "[4/4] Testing tsc..."
npx tsc --noEmit > ts-audit.log 2>&1
cat ts-audit.log
ERROR_COUNT=$(grep -c "error TS" ts-audit.log 2>/dev/null || echo "0")
echo ""
echo "Type errors found: $ERROR_COUNT"
echo "Log saved to: ~/MTAA_OS_V10/ts-audit.log"
