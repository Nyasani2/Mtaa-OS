#!/bin/bash
# MTAA OS V10 — Placeholder Screen Purge Script
# Moves placeholder/stub screens to .placeholder_archive/
# Run from project root: bash scripts/remove-placeholders.sh

set -e

echo "=== MTAA OS V10 PLACEHOLDER PURGE ==="
mkdir -p .placeholder_archive

# Patterns that indicate a placeholder screen
PLACEHOLDER_PATTERNS=(
  "Coming Soon"
  "Under Construction"
  "Placeholder"
  "TODO"
  "FIXME"
  "Not Implemented"
  "stub"
  "// TODO"
  "{/* TODO */}"
  "This screen is a placeholder"
)

MOVED=0
SKIPPED=0

# Find all .tsx route files in app/
find app/ -name "*.tsx" -type f | while read -r file; do
  is_placeholder=false
  for pattern in "${PLACEHOLDER_PATTERNS[@]}"; do
    if grep -qi "$pattern" "$file"; then
      is_placeholder=true
      break
    fi
  done

  # Also check if file is very small (< 500 bytes = likely stub)
  size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
  if [ "$size" -lt 500 ] && [ "$is_placeholder" = false ]; then
    # Very small file — flag for review but don't auto-move
    echo "  [REVIEW] $file ($size bytes)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [ "$is_placeholder" = true ]; then
    # Move to archive
    rel_path="${file#app/}"
    archive_path=".placeholder_archive/$rel_path"
    mkdir -p "$(dirname "$archive_path")"
    mv "$file" "$archive_path"
    echo "  [MOVED] $file → $archive_path"
    MOVED=$((MOVED + 1))
  fi
done

echo ""
echo "=== PURGE COMPLETE ==="
echo "Moved: $MOVED files"
echo "Flagged for review: $SKIPPED files"
echo ""
echo "To restore a moved file:"
echo "  mv .placeholder_archive/app/(module)/screen.tsx app/(module)/screen.tsx"
