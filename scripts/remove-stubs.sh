#!/bin/bash
cd "$HOME/MTAA_OS_V10"
echo "Scanning for stubs..."
find . -type f \( -name "*.tsx" -o -name "*.ts" \) | grep -v node_modules | while read f; do
  lines=$(wc -l < "$f" | tr -d ' ')
  if [ "$lines" -lt 5 ]; then
    content=$(cat "$f" 2>/dev/null | tr '[:upper:]' '[:lower:]')
    if echo "$content" | grep -qE "todo|stub|placeholder|fixme|not implemented|coming soon"; then
      echo "  🗑️  $f ($lines lines) — stub removed"; rm -f "$f"
    fi
  fi
done
find . -type d -empty | grep -v node_modules | grep -v .git | while read d; do echo "  🗑️  Empty dir: $d"; rmdir "$d" 2>/dev/null || true; done
echo "✅ Stub cleanup complete"
