#!/bin/bash
set -e

echo "=== PURGING PULSE FROM MTAA OS V10 ==="
echo ""

# 1. Delete all pulse directories
echo "[1/6] Deleting pulse directories..."
rm -rf domains/pulse/
rm -rf "app/(os)/pulse/"
rm -rf "app/(pulse)/"
rm -rf lib/pulse/
rm -rf lib/services/pulse-*
rm -rf lib/hooks/usePulse*
rm -rf components/pulse/
rm -rf lib/integrations/pulse/

# 2. Delete any pulse-related files scattered in lib/
echo "[2/6] Deleting pulse service files..."
find lib/ -name "*pulse*" -type f -delete 2>/dev/null || true
find lib/ -name "*pulse*" -type d -exec rm -rf {} + 2>/dev/null || true

# 3. Remove pulse imports from barrel files
echo "[3/6] Cleaning barrel exports..."

if [ -f lib/services/index.ts ]; then
    sed -i '/pulse/d' lib/services/index.ts
    sed -i '/Pulse/d' lib/services/index.ts
fi

if [ -f lib/hooks/index.ts ]; then
    sed -i '/pulse/d' lib/hooks/index.ts
    sed -i '/Pulse/d' lib/hooks/index.ts
fi

find . -name "index.ts" -type f -exec sed -i '/pulse/d' {} \; 2>/dev/null || true
find . -name "index.ts" -type f -exec sed -i '/Pulse/d' {} \; 2>/dev/null || true

# 4. Remove pulse from app store / registry
echo "[4/6] Removing pulse from app registry..."
if [ -f lib/kernel/registry/app-registry.ts ]; then
    sed -i '/pulse/d' lib/kernel/registry/app-registry.ts
    sed -i '/Pulse/d' lib/kernel/registry/app-registry.ts
fi

if [ -f "app/(os)/appstore/index.tsx" ]; then
    sed -i '/pulse/d' "app/(os)/appstore/index.tsx"
    sed -i '/Pulse/d' "app/(os)/appstore/index.tsx"
fi

# 5. Remove pulse routes from navigation
echo "[5/6] Cleaning navigation routes..."
find app/ -name "*.tsx" -type f -exec sed -i '/pulse/d' {} \; 2>/dev/null || true
find app/ -name "*.ts" -type f -exec sed -i '/pulse/d' {} \; 2>/dev/null || true

# 6. Remove pulse from any config / manifest files
echo "[6/6] Cleaning config files..."
find . -name "*.json" -type f -exec sed -i '/pulse/d' {} \; 2>/dev/null || true
find . -name "*.ts" -type f -exec sed -i '/pulse/d' {} \; 2>/dev/null || true
find . -name "*.tsx" -type f -exec sed -i '/pulse/d' {} \; 2>/dev/null || true

# Delete any leftover pulse files
echo ""
echo "Deleting remaining pulse files..."
find . -path ./node_modules -prune -o -path ./.git -prune -o -name "*pulse*" -type f -print -delete 2>/dev/null || true
find . -path ./node_modules -prune -o -path ./.git -prune -o -name "*pulse*" -type d -print -exec rm -rf {} + 2>/dev/null || true

echo ""
echo "=== PULSE PURGE COMPLETE ==="
echo ""
echo "Verifying no pulse remains..."
find . -path ./node_modules -prune -o -path ./.git -prune -o -name "*pulse*" -print 2>/dev/null | grep -v node_modules | grep -v ".git" || echo "No pulse files found."
