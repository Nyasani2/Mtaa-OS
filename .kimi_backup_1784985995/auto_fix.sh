#!/bin/bash
# Auto-fix Expo Router conflicts by renaming .tsx leaf files to .tsx.bak
# when a matching index.tsx exists inside a directory

echo "=== Auto-fixing Expo Router conflicts ==="
echo ""

find app -type f -name "*.tsx" | while read f; do
  dir=$(dirname "$f")
  base=$(basename "$f" .tsx)
  # Skip _layout, index, and files inside group dirs that end with )
  if [[ "$base" == "_layout" ]] || [[ "$base" == "index" ]]; then continue; fi
  # Check if there's a directory with same name containing index.tsx
  if [ -d "$dir/$base" ] && [ -f "$dir/$base/index.tsx" ]; then
    echo "CONFLICT: $f vs $dir/$base/index.tsx"
    echo "  -> Backing up $f to $f.bak"
    mv "$f" "$f.bak"
  fi
done

echo ""
echo "=== Done. Conflicts resolved. ==="
echo "Run: npx expo start --clear"
