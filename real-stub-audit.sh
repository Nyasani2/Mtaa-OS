#!/bin/bash
# MTAA Real Stub Audit
# Filters out TextInput placeholders and style names — finds actual stubs only

PROJECT_ROOT="${1:-.}"
OUT="${2:-real-stub-audit.txt}"

cd "$PROJECT_ROOT"

echo "=== MTAA REAL STUB AUDIT ===" > "$OUT"
echo "Generated: $(date)" >> "$OUT"
echo "" >> "$OUT"

# 1. Placeholder screens (actual stub exports)
echo "=== 1. PLACEHOLDER SCREENS (export default function PlaceholderScreen) ===" >> "$OUT"
grep -rln "export default function PlaceholderScreen" app lib components --include="*.tsx" 2>/dev/null | while read f; do
  echo "STUB SCREEN: $f" >> "$OUT"
done
if [ $? -ne 0 ]; then echo "  (none found)" >> "$OUT"; fi

echo "" >> "$OUT"

# 2. TODO comments in engine/service files
echo "=== 2. TODO COMMENTS IN ENGINE/SERVICE FILES ===" >> "$OUT"
grep -rn "TODO\|FIXME\|HACK\|XXX" lib/asis-* lib/kernel lib/modules lib/services lib/security lib/identity --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | head -50 >> "$OUT" || echo "  (none found)" >> "$OUT"

echo "" >> "$OUT"

# 3. MOCK data used as primary source (not test files)
echo "=== 3. MOCK DATA USED AS PRIMARY SOURCE ===" >> "$OUT"
grep -rln "const MOCK_" app lib components --include="*.ts" --include="*.tsx" 2>/dev/null | while read f; do
  echo "MOCK DATA: $f" >> "$OUT"
done
if [ $? -ne 0 ]; then echo "  (none found)" >> "$OUT"; fi

echo "" >> "$OUT"

# 4. Coming Soon alerts in non-test files
echo "=== 4. 'COMING SOON' ALERTS ===" >> "$OUT"
grep -rn "Coming Soon" app lib components --include="*.tsx" --include="*.ts" 2>/dev/null | grep -i "alert\|Alert" | head -50 >> "$OUT" || echo "  (none found)" >> "$OUT"

echo "" >> "$OUT"

# 5. Stub function exports
echo "=== 5. STUB FUNCTION EXPORTS ===" >> "$OUT"
grep -rn "stub\|not implemented yet\|placeholder" lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "placeholderTextColor" | grep -v "avatarPlaceholder" | grep -v "mapPlaceholder" | grep -v "videoPlaceholder" | grep -v "chartPlaceholder" | grep -v "thumbPlaceholder" | grep -v "keyPlaceholder" | grep -v "filePlaceholder" | grep -v "campaignImagePlaceholder" | head -50 >> "$OUT" || echo "  (none found)" >> "$OUT"

echo "" >> "$OUT"
echo "=== END REAL STUB AUDIT ===" >> "$OUT"
echo "Results saved to: $OUT"
