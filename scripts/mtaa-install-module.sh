#!/bin/bash
# ============================================================
# MTAA OS — Standardized Module Installation & Audit Workflow
# ============================================================
# Usage: ./mtaa-install-module.sh <module-name>
# Example: ./mtaa-install-module.sh mtaxi-inspection

set -e

MODULE_NAME="${1:-module}"
ZIP_FILE="$HOME/Downloads/${MODULE_NAME}.zip"
PROJECT_DIR="$HOME/MTAA_OS_V10"
TMP_DIR="/tmp/module_fix"

echo "========================================"
echo "MTAA Module Installer: $MODULE_NAME"
echo "========================================"

# 1. Clean temp
echo "[1/7] Cleaning /tmp..."
cd /tmp
rm -rf module_fix
mkdir -p module_fix && cd module_fix

# 2. Extract ZIP
echo "[2/7] Extracting $ZIP_FILE..."
if [ ! -f "$ZIP_FILE" ]; then
    echo "ERROR: $ZIP_FILE not found in Downloads"
    exit 1
fi
unzip -o "$ZIP_FILE"

# 3. Copy files to project
echo "[3/7] Copying files to $PROJECT_DIR..."
cd "$PROJECT_DIR"

# Auto-detect common file types and copy
if [ -d "/tmp/module_fix/sql" ]; then
    echo "  → SQL files found. Run manually in Supabase SQL Editor:"
    find /tmp/module_fix/sql -name "*.sql" -exec echo "     {}" \;
fi

if [ -d "/tmp/module_fix/supabase/functions" ]; then
    echo "  → Edge functions found. Copying..."
    cp -r /tmp/module_fix/supabase/functions/* "$PROJECT_DIR/supabase/functions/" 2>/dev/null || true
fi

if [ -d "/tmp/module_fix/frontend" ]; then
    echo "  → Frontend files found. Copying..."
    find /tmp/module_fix/frontend -type f | while read f; do
        target="${f#/tmp/module_fix/frontend/}"
        mkdir -p "$(dirname "$target")"
        cp "$f" "$target"
        echo "     → $target"
    done
fi

if [ -d "/tmp/module_fix/lib" ]; then
    echo "  → lib/ files found. Copying..."
    cp -r /tmp/module_fix/lib/* "$PROJECT_DIR/lib/" 2>/dev/null || true
fi

# 4. Ensure TypeScript is installed
echo "[4/7] Checking TypeScript..."
cd "$PROJECT_DIR"
if ! npx tsc --version >/dev/null 2>&1; then
    echo "  → TypeScript not found. Installing..."
    npm install -D typescript @types/react @types/react-native
fi

# 5. Type check
echo "[5/7] Running TypeScript check (noEmit)..."
npx tsc --noEmit > ts-audit.log 2>&1 || true
cat ts-audit.log
ERROR_COUNT=$(grep -c "error TS" ts-audit.log 2>/dev/null || echo "0")
echo "  → Type errors found: $ERROR_COUNT"

# 6. Expo doctor
echo "[6/7] Running expo-doctor..."
npx expo-doctor 2>&1 | tee expo-doctor.log || true

# 7. Start clean
echo "[7/7] Starting Expo (clean)..."
echo "========================================"
echo "AUDIT COMPLETE"
echo "========================================"
echo "Logs saved:"
echo "  - $PROJECT_DIR/ts-audit.log"
echo "  - $PROJECT_DIR/expo-doctor.log"
echo ""
echo "Next: Review type errors above, fix them, then run:"
echo "  npx expo start --clear"
echo "========================================"
