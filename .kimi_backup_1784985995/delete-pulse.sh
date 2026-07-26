#!/bin/bash
# delete-pulse.sh — Completely removes Pulse module from MTAA OS V10
cd ~/MTAA_OS_V10
set -e

BACKUP=".pulse_deleted_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"

echo "=== PULSE MODULE DELETION ==="
echo "Backup dir: $BACKUP"
echo ""

# 1. BACKUP & REMOVE route files
echo "--- Removing Pulse routes ---"
if [ -d "app/(pulse)" ]; then
  cp -r app/\(pulse\) "$BACKUP/"
  rm -rf app/\(pulse\)
  echo "  ✓ Removed app/(pulse)/"
fi

if [ -d "app/pulse" ]; then
  cp -r app/pulse "$BACKUP/"
  rm -rf app/pulse
  echo "  ✓ Removed app/pulse/"
fi

# 2. BACKUP & REMOVE lib/pulse
echo ""
echo "--- Removing Pulse lib files ---"
if [ -d "lib/pulse" ]; then
  cp -r lib/pulse "$BACKUP/"
  rm -rf lib/pulse
  echo "  ✓ Removed lib/pulse/"
fi

# 3. BACKUP & REMOVE pulse service files
echo ""
echo "--- Removing Pulse services ---"
for f in lib/services/pulse-service.ts lib/services/pulse*.ts; do
  if [ -f "$f" ]; then
    cp "$f" "$BACKUP/"
    rm -f "$f"
    echo "  ✓ Removed $f"
  fi
done

# 4. BACKUP & REMOVE pulse hooks
echo ""
echo "--- Removing Pulse hooks ---"
for f in lib/hooks/usePulse*.ts lib/hooks/use-pulse*.ts; do
  if [ -f "$f" ]; then
    cp "$f" "$BACKUP/"
    rm -f "$f"
    echo "  ✓ Removed $f"
  fi
done

# 5. BACKUP & REMOVE pulse components
echo ""
echo "--- Removing Pulse components ---"
if [ -d "lib/components/pulse" ]; then
  cp -r lib/components/pulse "$BACKUP/"
  rm -rf lib/components/pulse
  echo "  ✓ Removed lib/components/pulse/"
fi

# 6. REMOVE pulse from kernel registry
echo ""
echo "--- Removing Pulse from registry ---"
if [ -f "lib/kernel/registry.ts" ]; then
  cp lib/kernel/registry.ts "$BACKUP/registry.ts.backup"
  sed -i '/pulse/d' lib/kernel/registry.ts
  sed -i '/Pulse/d' lib/kernel/registry.ts
  echo "  ✓ Cleaned lib/kernel/registry.ts"
fi

if [ -f "lib/mtaa/appstore/store.ts" ]; then
  cp lib/mtaa/appstore/store.ts "$BACKUP/appstore-store.ts.backup"
  sed -i '/pulse/d' lib/mtaa/appstore/store.ts
  sed -i '/Pulse/d' lib/mtaa/appstore/store.ts
  echo "  ✓ Cleaned lib/mtaa/appstore/store.ts"
fi

# 7. REMOVE pulse from any manifest files
echo ""
echo "--- Removing Pulse from manifests ---"
find lib/modules -name "*.ts" -type f | while read -r f; do
  if grep -qi "pulse" "$f" 2>/dev/null; then
    cp "$f" "$BACKUP/$(basename "$f").backup"
    sed -i '/pulse/d' "$f"
    sed -i '/Pulse/d' "$f"
    echo "  ✓ Cleaned $f"
  fi
done

# 8. REMOVE pulse from app store / launcher
echo ""
echo "--- Removing Pulse from launcher ---"
if [ -f "app/(os)/index.tsx" ]; then
  cp app/\(os\)/index.tsx "$BACKUP/launcher-index.tsx.backup"
  sed -i '/pulse/d' app/\(os\)/index.tsx
  sed -i '/Pulse/d' app/\(os\)/index.tsx
  echo "  ✓ Cleaned app/(os)/index.tsx"
fi

# 9. REMOVE pulse references from _layout files
echo ""
echo "--- Removing Pulse from navigation ---"
find app/ -name "_layout.tsx" -type f | while read -r f; do
  if grep -qi "pulse" "$f" 2>/dev/null; then
    cp "$f" "$BACKUP/$(echo "$f" | tr '/' '_').backup"
    sed -i '/pulse/d' "$f"
    sed -i '/Pulse/d' "$f"
    echo "  ✓ Cleaned $f"
  fi
done

# 10. REMOVE pulse from any remaining imports in app/
echo ""
echo "--- Scanning for remaining Pulse imports ---"
find app/ lib/ -name "*.tsx" -o -name "*.ts" | while read -r f; do
  if grep -qi "pulse" "$f" 2>/dev/null; then
    echo "  ⚠️  STILL HAS PULSE REF: $f"
    grep -n -i "pulse" "$f" | head -3
  fi
done

echo ""
echo "=== PULSE DELETION COMPLETE ==="
echo "Backup saved to: $BACKUP"
echo ""
echo "To restore: cp -r $BACKUP/app/\(pulse\) app/  (and restore other files as needed)"
echo ""
echo "=== VERIFY ==="
echo "Remaining pulse files:"
find app/ lib/ -iname "*pulse*" -type f 2>/dev/null | wc -l
echo "Pulse mentions in code:"
grep -ri "pulse" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l
