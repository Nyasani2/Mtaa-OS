#!/bin/bash
set -e

echo "=== MTAA Profile Complete Fix Installer ==="
echo ""

# Backup existing files
mkdir -p app/\(os\)/profile/.backup
cp app/\(os\)/profile/index.tsx app/\(os\)/profile/.backup/index.tsx 2>/dev/null || true
cp app/\(os\)/profile/edit.tsx app/\(os\)/profile/.backup/edit.tsx 2>/dev/null || true
cp app/\(os\)/profile/analytics.tsx app/\(os\)/profile/.backup/analytics.tsx 2>/dev/null || true
cp app/\(os\)/profile/privacy.tsx app/\(os\)/profile/.backup/privacy.tsx 2>/dev/null || true
cp app/\(os\)/profile/earnings.tsx app/\(os\)/profile/.backup/earnings.tsx 2>/dev/null || true

echo "[1/6] Backed up existing files to app/(os)/profile/.backup/"

# Copy fixed files
cp index.tsx app/\(os\)/profile/index.tsx
cp edit.tsx app/\(os\)/profile/edit.tsx
cp analytics.tsx app/\(os\)/profile/analytics.tsx
cp privacy.tsx app/\(os\)/profile/privacy.tsx
cp earnings.tsx app/\(os\)/profile/earnings.tsx

echo "[2/6] Copied fixed profile files"

# Messages route — check if app/(os)/messages/index.tsx exists
if [ ! -f "app/\(os\)/messages/index.tsx" ]; then
    mkdir -p app/\(os\)/messages
    cp messages.tsx app/\(os\)/messages/index.tsx
    echo "[3/6] Created app/(os)/messages/index.tsx"
else
    cp messages.tsx app/\(os\)/messages/index.tsx
    echo "[3/6] Updated app/(os)/messages/index.tsx"
fi

# Verify no conflicting flat files exist
echo "[4/6] Checking for conflicting flat route files..."
for f in transfer top-up withdraw privacy earnings messages analytics; do
    if [ -f "app/\(os\)/profile/${f}.tsx" ]; then
        echo "  WARNING: Found conflicting flat file app/(os)/profile/${f}.tsx — DELETING"
        rm "app/\(os\)/profile/${f}.tsx"
    fi
done

# Also check wallet flat files
for f in transfer top-up withdraw; do
    if [ -f "app/\(os\)/wallet/${f}.tsx" ]; then
        echo "  WARNING: Found conflicting flat file app/(os)/wallet/${f}.tsx — DELETING"
        rm "app/\(os\)/wallet/${f}.tsx"
    fi
done

echo "[5/6] Conflicting flat files cleaned"

# List final state
echo ""
echo "=== Final Profile Routes ==="
ls -la app/\(os\)/profile/*.tsx 2>/dev/null || echo "  (no .tsx files found)"
echo ""
echo "=== Final Messages Route ==="
ls -la app/\(os\)/messages/*.tsx 2>/dev/null || echo "  (no .tsx files found)"

echo ""
echo "[6/6] DONE. Run: npx expo start --clear"
