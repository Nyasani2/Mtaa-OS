#!/bin/bash
OUT=~/Desktop/frontend_audit_modules.txt
echo "=== MTAA FRONTEND AUDIT ===" > "$OUT"
echo "Generated: $(date)" >> "$OUT"

for MODULE in streets tribes studio education; do
  echo "" >> "$OUT"
  echo "========== ${MODULE^^} ==========" >> "$OUT"
  
  # Find all TS/TSX files for this module
  find app/\($MODULE\) lib/$MODULE lib/services/${MODULE}*.ts lib/hooks/use${MODULE^}*.ts lib/hooks/use-${MODULE}*.ts -name "*.ts" -o -name "*.tsx" 2>/dev/null | while read f; do
    if [ -f "$f" ]; then
      echo "" >> "$OUT"
      echo "--- FILE: $f ---" >> "$OUT"
      cat "$f" >> "$OUT"
    fi
  done
done

echo "Done. File: $OUT"
ls -lh "$OUT"
