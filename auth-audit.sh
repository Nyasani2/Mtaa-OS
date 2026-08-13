#!/bin/bash
# MTAA Auth Audit — Clean Version
cd ~/MTAA_OS_V10
OUT=~/Desktop/auth-audit.txt

echo "=== MTAA AUTH AUDIT ===" > "$OUT"
echo "Generated: $(date)" >> "$OUT"

# 1. Duplicate auth files
echo "" >> "$OUT"
echo "=== 1. DUPLICATE AUTH FILES ===" >> "$OUT"
if [ -d "app/auth" ]; then
  for oldfile in app/auth/*.tsx; do
    [ -f "$oldfile" ] || continue
    base=$(basename "$oldfile")
    newfile="app/(auth)/$base"
    if [ -f "$newfile" ]; then
      echo "DUPLICATE: $oldfile vs $newfile" >> "$OUT"
    else
      echo "ORPHAN: $oldfile" >> "$OUT"
    fi
  done
fi

# 2. Router conflicts
echo "" >> "$OUT"
echo "=== 2. ROUTER CONFLICTS ===" >> "$OUT"
for dir in "app/(os)/profile" "app/(os)/settings" "app/(os)/wallet" "app/(auth)"; do
  [ -d "$dir" ] || continue
  for f in "$dir"/*.tsx; do
    [ -f "$f" ] || continue
    base=$(basename "$f" .tsx)
    idx="$dir/$base/index.tsx"
    [ -f "$idx" ] && echo "CONFLICT: $f + $idx" >> "$OUT"
  done
done

# 3. Old files that should be gone
echo "" >> "$OUT"
echo "=== 3. OLD FILES TO DELETE ===" >> "$OUT"
for f in app/auth/set-pin.tsx app/auth/forgot-pin.tsx app/auth/lock-screen.tsx app/auth/biometric-enroll.tsx app/settings/blocked.tsx "app/(os)/settings/change-pin.tsx" "app/(os)/wallet/onboarding/pin-create.tsx"; do
  [ -f "$f" ] && echo "DELETE: $f" >> "$OUT"
done

# 4. Duplicate auth stores
echo "" >> "$OUT"
echo "=== 4. DUPLICATE AUTH STORES ===" >> "$OUT"
[ -f "lib/stores/auth-store.ts" ] && echo "OLD: lib/stores/auth-store.ts" >> "$OUT"
[ -f "lib/auth/useAuthStore.ts" ] && echo "OLD: lib/auth/useAuthStore.ts" >> "$OUT"
[ -f "lib/kernel/auth/useAuthStore.ts" ] && echo "OLD: lib/kernel/auth/useAuthStore.ts" >> "$OUT"
[ -f "lib/auth/store/auth.store.ts" ] && echo "CANONICAL: lib/auth/store/auth.store.ts ($(wc -c < "lib/auth/store/auth.store.ts" | awk '{print $1}') bytes)" >> "$OUT"

# 5. Bad imports
echo "" >> "$OUT"
echo "=== 5. BAD IMPORT PATHS ===" >> "$OUT"
grep -rn "lib/stores/auth-store" app lib components --include="*.ts" --include="*.tsx" 2>/dev/null | sed 's/^/BAD: /' >> "$OUT" || echo "  (none)" >> "$OUT"
grep -rn "lib/kernel/auth/useAuthStore" app lib components --include="*.ts" --include="*.tsx" 2>/dev/null | sed 's/^/BAD: /' >> "$OUT" || echo "  (none)" >> "$OUT"

# 6. Stub markers
echo "" >> "$OUT"
echo "=== 6. STUB MARKERS ===" >> "$OUT"
find app lib components -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  matches=$(grep -inE "TODO|FIXME|HACK|XXX|coming soon|placeholder|stub|fake|mock|not implemented|hardcoded" "$f" 2>/dev/null | head -3)
  [ -n "$matches" ] && echo "STUB: $f" >> "$OUT" && echo "$matches" | sed 's/^/  /' >> "$OUT"
done

# 7. Summary
echo "" >> "$OUT"
echo "=== SUMMARY ===" >> "$OUT"
echo "Duplicates: $(grep -c "^DUPLICATE:" "$OUT" 2>/dev/null || echo 0)" >> "$OUT"
echo "Orphans: $(grep -c "^ORPHAN:" "$OUT" 2>/dev/null || echo 0)" >> "$OUT"
echo "Conflicts: $(grep -c "^CONFLICT:" "$OUT" 2>/dev/null || echo 0)" >> "$OUT"
echo "To delete: $(grep -c "^DELETE:" "$OUT" 2>/dev/null || echo 0)" >> "$OUT"
echo "Old stores: $(grep -c "^OLD:" "$OUT" 2>/dev/null || echo 0)" >> "$OUT"
echo "Bad imports: $(grep -c "^BAD:" "$OUT" 2>/dev/null || echo 0)" >> "$OUT"
echo "Stubs: $(grep -c "^STUB:" "$OUT" 2>/dev/null || echo 0)" >> "$OUT"

echo "" >> "$OUT"
echo "Saved to: $OUT" >> "$OUT"
cat "$OUT"
