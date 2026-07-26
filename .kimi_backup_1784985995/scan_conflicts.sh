#!/bin/bash
# Find all Expo Router route conflicts
# A conflict exists when both file.tsx and file/index.tsx exist in the same dir

echo "=== Expo Router Route Conflict Scanner ==="
echo ""

find app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) | while read f; do
  dir=$(dirname "$f")
  base=$(basename "$f" | sed 's/\.[^.]*$//')
  # Skip _layout files and index files
  if [[ "$base" == "_layout" ]] || [[ "$base" == "index" ]]; then continue; fi
  # Check if a directory with the same name exists
  if [ -d "$dir/$base" ]; then
    # Check if that directory has an index file
    if [ -f "$dir/$base/index.tsx" ] || [ -f "$dir/$base/index.ts" ] || [ -f "$dir/$base/index.jsx" ] || [ -f "$dir/$base/index.js" ]; then
      echo "CONFLICT: $dir/$base.tsx (or .ts/.jsx/.js) vs $dir/$base/index.*"
      echo "  -> Keep ONE. Delete the other."
      echo ""
    fi
  fi
done

echo "=== Done ==="
