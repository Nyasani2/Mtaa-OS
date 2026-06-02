#!/bin/bash
cd "$HOME/MTAA_OS_V10"
OUT="$HOME/Desktop/broken-imports-$(date +%Y%m%d).txt"
echo "=== BROKEN IMPORT AUDIT ===" > "$OUT"
echo "Generated: $(date)" >> "$OUT"; echo "" >> "$OUT"
grep -rn "from '@/" app lib components hooks --include="*.tsx" --include="*.ts" 2>/dev/null | while read line; do
  path=$(echo "$line" | grep -o "'@/[^']*'" | tr -d "'" | sed 's|^@/||')
  if [ ! -f "$path.tsx" ] && [ ! -f "$path.ts" ] && [ ! -f "$path/index.tsx" ] && [ ! -f "$path/index.ts" ] && [ ! -d "$path" ]; then
    echo "❌ MISSING: $line" >> "$OUT"
  fi
done
echo "Report saved to: $OUT"; cat "$OUT"
