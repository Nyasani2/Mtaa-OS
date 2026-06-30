#!/bin/bash
set -e

echo "=== MTAA Profile V2 Fix Installer ==="
echo ""

# Backup
mkdir -p app/\(os\)/profile/.backup_v2
cp app/\(os\)/profile/edit.tsx app/\(os\)/profile/.backup_v2/edit.tsx 2>/dev/null || true
cp app/\(os\)/profile/earnings.tsx app/\(os\)/profile/.backup_v2/earnings.tsx 2>/dev/null || true
cp app/\(os\)/messages/index.tsx app/\(os\)/messages/.backup_v2_index.tsx 2>/dev/null || true

echo "[1/5] Backed up existing files"

# Copy fixed files
cp edit.tsx app/\(os\)/profile/edit.tsx
cp earnings.tsx app/\(os\)/profile/earnings.tsx
cp messages.tsx app/\(os\)/messages/index.tsx

echo "[2/5] Copied fixed files"

# Delete duplicate messages.tsx under profile/ (dead code)
if [ -f "app/\(os\)/profile/messages.tsx" ]; then
    rm app/\(os\)/profile/messages.tsx
    echo "[3/5] Deleted duplicate app/(os)/profile/messages.tsx"
else
    echo "[3/5] No duplicate messages.tsx found (good)"
fi

# Verify no conflicting flat files
echo "[4/5] Checking for route conflicts..."
for f in privacy earnings messages analytics; do
    if [ -f "app/\(os\)/profile/${f}.tsx" ]; then
        echo "  WARNING: Found conflicting flat file app/(os)/profile/${f}.tsx"
    else
        echo "  OK: No conflict for ${f}"
    fi
done

# List final state
echo ""
echo "[5/5] Final Profile Routes:"
ls -la app/\(os\)/profile/*.tsx 2>/dev/null

echo ""
echo "Final Messages Route:"
ls -la app/\(os\)/messages/*.tsx 2>/dev/null

echo ""
echo "DONE. Run: npx expo start --clear"
