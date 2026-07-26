#!/bin/bash
# restore-archived.sh — Put back every file my purge script wrongly moved
cd ~/MTAA_OS_V10

echo "=== RESTORING ARCHIVED FILES ==="
if [ ! -d ".placeholder_archive" ]; then
  echo "No archive found. Nothing to restore."
  exit 0
fi

# Move every file back from .placeholder_archive/ to app/
find .placeholder_archive -type f | while read -r archived; do
  # Strip .placeholder_archive/ prefix to get original path
  target="${archived#.placeholder_archive/}"
  target="app/$target"

  # Create parent directory if missing
  mkdir -p "$(dirname "$target")"

  # Only restore if target doesn't already exist (preserves REVIEW files)
  if [ ! -f "$target" ]; then
    mv "$archived" "$target"
    echo "  [RESTORED] $target"
  else
    echo "  [SKIP] $target already exists"
  fi
done

# Clean up empty archive directories
find .placeholder_archive -type d -empty -delete 2>/dev/null

echo ""
echo "=== VERIFY ==="
echo "Route files in app/: $(find app/ -name '*.tsx' | wc -l)"
echo ""
echo "=== RESTORE COMPLETE ==="
