#!/bin/bash
# MTAA Auth Duplicate & Stub Audit
# Run this from ~/MTAA_OS_V10

cd ~/MTAA_OS_V10
OUT=~/Desktop/auth-duplicate-audit.txt

echo "=== MTAA AUTH DUPLICATE & STUB AUDIT ===" > "$OUT"
echo "Generated: $(date)" >> "$OUT"
echo "" >> "$OUT"

# ============================================================
# 1. Check for duplicate auth files (old vs new locations)
# ============================================================
echo "============================================================" >> "$OUT"
echo "1. DUPLICATE AUTH FILES (same base name, different paths)" >> "$OUT"
echo "============================================================" >> "$OUT"

# Compare old app/auth/ vs new app/(auth)/
if [ -d "app/auth" ]; then
  echo "" >> "$OUT"
  echo "--- Old app/auth/ vs New app/(auth)/ ---" >> "$OUT"
  for oldfile in app/auth/*.tsx; do
    if [ -f "$oldfile" ]; then
      basename=$(basename "$oldfile")
      newfile="app/(auth)/$basename"
      if [ -f "$newfile" ]; then
        echo "DUPLICATE: $oldfile  AND  $newfile" >> "$OUT"
        echo "  OLD size: $(wc -c < "$oldfile") bytes" >> "$OUT"
        echo "  NEW size: $(wc -c < "$newfile") bytes" >> "$OUT"
      else
        echo "ORPHAN (old only): $oldfile ($(wc -c < "$oldfile") bytes)" >> "$OUT"
      fi
    fi
  done
fi

# Compare old app/settings/ vs new app/(os)/settings/
if [ -d "app/settings" ]; then
  echo "" >> "$OUT"
  echo "--- Old app/settings/ vs New app/(os)/settings/ ---" >> "$OUT"
  for oldfile in app/settings/*.tsx; do
    if [ -f "$oldfile" ]; then
      basename=$(basename "$oldfile")
      newfile="app/(os)/settings/$basename"
      if [ -f "$newfile" ]; then
        echo "DUPLICATE: $oldfile  AND  $newfile" >> "$OUT"
        echo "  OLD size: $(wc -c < "$oldfile") bytes" >> "$OUT"
        echo "  NEW size: $(wc -c < "$newfile") bytes" >> "$OUT"
      else
        echo "ORPHAN (old only): $oldfile ($(wc -c < "$oldfile") bytes)" >> "$OUT"
      fi
    fi
  done
fi

# Compare lib/stores/auth-store.ts vs lib/auth/store/auth.store.ts
if [ -f "lib/stores/auth-store.ts" ] && [ -f "lib/auth/store/auth.store.ts" ]; then
  echo "" >> "$OUT"
  echo "--- Duplicate auth stores ---" >> "$OUT"
  echo "DUPLICATE: lib/stores/auth-store.ts AND lib/auth/store/auth.store.ts" >> "$OUT"
  echo "  OLD size: $(wc -c < "lib/stores/auth-store.ts") bytes" >> "$OUT"
  echo "  NEW size: $(wc -c < "lib/auth/store/auth.store.ts") bytes" >> "$OUT"
fi

if [ -f "lib/auth/useAuthStore.ts" ] && [ -f "lib/auth/store/auth.store.ts" ]; then
  echo "DUPLICATE: lib/auth/useAuthStore.ts AND lib/auth/store/auth.store.ts" >> "$OUT"
  echo "  OLD size: $(wc -c < "lib/auth/useAuthStore.ts") bytes" >> "$OUT"
  echo "  NEW size: $(wc -c < "lib/auth/store/auth.store.ts") bytes" >> "$OUT"
fi

if [ -f "lib/kernel/auth/useAuthStore.ts" ] && [ -f "lib/auth/store/auth.store.ts" ]; then
  echo "DUPLICATE: lib/kernel/auth/useAuthStore.ts AND lib/auth/store/auth.store.ts" >> "$OUT"
  echo "  OLD size: $(wc -c < "lib/kernel/auth/useAuthStore.ts") bytes" >> "$OUT"
  echo "  NEW size: $(wc -c < "lib/auth/store/auth.store.ts") bytes" >> "$OUT"
fi

# ============================================================
# 2. Check for .tsx + index.tsx conflicts (Expo Router)
# ============================================================
echo "" >> "$OUT"
echo "============================================================" >> "$OUT"
echo "2. EXPO ROUTER CONFLICTS (.tsx + folder/index.tsx)" >> "$OUT"
echo "============================================================" >> "$OUT"

for dir in app/\(os\)/profile app/\(os\)/settings app/\(os\)/wallet app/\(auth\); do
  if [ -d "$dir" ]; then
    echo "" >> "$OUT"
    echo "--- Checking $dir ---" >> "$OUT"
    cd "$dir"
    for f in *.tsx; do
      if [ -f "$f" ]; then
        name="${f%.tsx}"
        if [ -d "$name" ] && [ -f "$name/index.tsx" ]; then
          echo "CONFLICT: $dir/$f and $dir/$name/index.tsx both exist" >> "$OUT"
        fi
      fi
    done
    cd - > /dev/null
  fi
done

# ============================================================
# 3. Check for stub/placeholder/TODO markers
# ============================================================
echo "" >> "$OUT"
echo "============================================================" >> "$OUT"
echo "3. STUB/PLACEHOLDER/TODO MARKERS IN AUTH FILES" >> "$OUT"
echo "============================================================" >> "$OUT"

STUB_PATTERNS="TODO|FIXME|HACK|XXX|coming soon|placeholder|stub|fake|mock|not implemented|not yet|hardcoded|console\.log"

for file in   app/\(auth\)/*.tsx   app/\(os\)/profile/*.tsx   app/\(os\)/settings/*.tsx   app/\(os\)/wallet/*.tsx   lib/auth/**/*.ts   lib/security/*.ts   lib/services/profile-service.ts   lib/services/streets-service.ts   components/auth/*.tsx   components/os/*.tsx
do
  if [ -f "$file" ]; then
    matches=$(grep -inE "$STUB_PATTERNS" "$file" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo "" >> "$OUT"
      echo "STUB FOUND: $file" >> "$OUT"
      echo "$matches" | head -5 | sed 's/^/  /' >> "$OUT"
    fi
  fi
done

# ============================================================
# 4. Check for old files that cleanup scripts should have removed
# ============================================================
echo "" >> "$OUT"
echo "============================================================" >> "$OUT"
echo "4. FILES THAT SHOULD HAVE BEEN DELETED BY CLEANUP" >> "$OUT"
echo "============================================================" >> "$OUT"

OLD_FILES=(
  "app/auth/set-pin.tsx"
  "app/auth/forgot-pin.tsx"
  "app/settings/blocked.tsx"
  "app/(os)/settings/change-pin.tsx"
  "app/(os)/wallet/onboarding/pin-create.tsx"
  "app/auth/lock-screen.tsx"
  "app/auth/biometric-enroll.tsx"
)

for f in "${OLD_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "SHOULD DELETE: $f ($(wc -c < "$f") bytes)" >> "$OUT"
  fi
done

# ============================================================
# 5. Check for duplicate PIN/biometric/lock files
# ============================================================
echo "" >> "$OUT"
echo "============================================================" >> "$OUT"
echo "5. DUPLICATE PIN / BIOMETRIC / LOCK FILES" >> "$OUT"
echo "============================================================" >> "$OUT"

# Pin-related
PIN_FILES=$(find app lib/components -type f \( -iname "*pin*" -o -iname "*lock*" -o -iname "*biometric*" \) 2>/dev/null | sort)
if [ -n "$PIN_FILES" ]; then
  echo "" >> "$OUT"
  echo "All PIN/Lock/Biometric files:" >> "$OUT"
  echo "$PIN_FILES" | while read f; do
    echo "  $f ($(wc -c < "$f" | tr -d ' ') bytes)" >> "$OUT"
  done
fi

# ============================================================
# 6. Check auth store import path consistency
# ============================================================
echo "" >> "$OUT"
echo "============================================================" >> "$OUT"
echo "6. AUTH STORE IMPORT PATHS (should all use canonical)" >> "$OUT"
echo "============================================================" >> "$OUT"

echo "" >> "$OUT"
echo "Canonical source: lib/auth/store/auth.store.ts" >> "$OUT"
echo "Bad paths found (should be cleaned up):" >> "$OUT"

grep -rn "from.*lib/auth/store"" app lib components --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "auth.store.ts" >> "$OUT" || echo "  (none found — good)" >> "$OUT"

grep -rn "from.*lib/stores/auth-store" app lib components --include="*.ts" --include="*.tsx" 2>/dev/null >> "$OUT" || true
grep -rn "from.*lib/kernel/auth/useAuthStore" app lib components --include="*.ts" --include="*.tsx" 2>/dev/null >> "$OUT" || true
grep -rn "from.*lib/auth/useAuthStore"" app lib components --include="*.ts" --include="*.tsx" 2>/dev/null >> "$OUT" || true

# ============================================================
# 7. Summary
# ============================================================
echo "" >> "$OUT"
echo "============================================================" >> "$OUT"
echo "7. SUMMARY" >> "$OUT"
echo "============================================================" >> "$OUT"

DUPE_COUNT=$(grep -c "^DUPLICATE:" "$OUT" 2>/dev/null || echo "0")
ORPHAN_COUNT=$(grep -c "^ORPHAN" "$OUT" 2>/dev/null || echo "0")
CONFLICT_COUNT=$(grep -c "^CONFLICT:" "$OUT" 2>/dev/null || echo "0")
STUB_COUNT=$(grep -c "^STUB FOUND:" "$OUT" 2>/dev/null || echo "0")
DELETE_COUNT=$(grep -c "^SHOULD DELETE:" "$OUT" 2>/dev/null || echo "0")

echo "Duplicates found: $DUPE_COUNT" >> "$OUT"
echo "Orphan old files: $ORPHAN_COUNT" >> "$OUT"
echo "Expo Router conflicts: $CONFLICT_COUNT" >> "$OUT"
echo "Stub markers found: $STUB_COUNT" >> "$OUT"
echo "Files to delete: $DELETE_COUNT" >> "$OUT"

echo "" >> "$OUT"
echo "=== END OF AUDIT ===" >> "$OUT"
echo "Saved to: $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)" >> "$OUT"

cat "$OUT"
