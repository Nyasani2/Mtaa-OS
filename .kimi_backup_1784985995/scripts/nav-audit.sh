#!/bin/bash
# MTAA OS V10 — Cross-Module Navigation Audit
# Scans all screens for broken imports, dead buttons, missing route refs
# Run from project root: bash scripts/nav-audit.sh

echo "=== MTAA OS V10 NAVIGATION AUDIT ==="
echo ""

# 1. Find all route files
echo "[1/5] Scanning route files..."
ROUTE_COUNT=$(find app/ -name "*.tsx" -type f | wc -l)
echo "  Total route files: $ROUTE_COUNT"

# 2. Find broken imports (import paths that don't resolve)
echo ""
echo "[2/5] Checking for broken imports..."
find app/ lib/ -name "*.ts" -o -name "*.tsx" | while read -r file; do
  grep -oE 'from "@/[^"]+"' "$file" | sed 's/from "//;s/"$//' | while read -r import_path; do
    # Convert alias to actual path
    actual_path="${import_path/#@\/.}"
    if [ ! -f "$actual_path.ts" ] && [ ! -f "$actual_path.tsx" ] && [ ! -f "$actual_path/index.ts" ] && [ ! -f "$actual_path/index.tsx" ]; then
      echo "  [BROKEN] $file → $import_path"
    fi
  done
done

# 3. Find buttons without onPress or with empty handlers
echo ""
echo "[3/5] Checking for dead buttons..."
grep -rn "onPress={}" app/ --include="*.tsx" | while read -r line; do
  echo "  [DEAD] $line"
done
grep -rn "onPress={() => {}}" app/ --include="*.tsx" | while read -r line; do
  echo "  [DEAD] $line"
done
grep -rn "onPress={undefined}" app/ --include="*.tsx" | while read -r line; do
  echo "  [DEAD] $line"
done

# 4. Find navigation.push/router.push to non-existent routes
echo ""
echo "[4/5] Checking for invalid route references..."
grep -roE "router\.push\(['"][^'"]+['"]\)" app/ --include="*.tsx" | while read -r line; do
  route=$(echo "$line" | grep -oE "['"][^'"]+['"]" | tr -d "'"")
  # Check if route file exists (rough check)
  route_file="app${route}.tsx"
  route_index="app${route}/index.tsx"
  if [ ! -f "$route_file" ] && [ ! -f "$route_index" ]; then
    echo "  [INVALID] $line"
  fi
done

# 5. Find screens importing from paused civic modules
echo ""
echo "[5/5] Checking for civic module leaks..."
PAUSED_MODULES="police|courts|prisons|revenue|land|voting"
find app/ -name "*.tsx" | xargs grep -lE "($PAUSED_MODULES)" 2>/dev/null | while read -r file; do
  # Only flag if it's an actual import, not just a string mention
  if grep -qE "from.*($PAUSED_MODULES)" "$file"; then
    echo "  [LEAK] $file imports from paused civic module"
  fi
done

echo ""
echo "=== AUDIT COMPLETE ==="
echo "Fix all [BROKEN], [DEAD], [INVALID], and [LEAK] items before production."
