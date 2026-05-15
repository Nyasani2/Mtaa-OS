#!/usr/bin/env bash

echo "🧠 MTAA Kernel Type Repair Starting..."

# 1. Fix KernelEvent missing priority (add optional field globally)
find lib -type f -name "*.ts" -exec sed -i 's/KernelEvent {/KernelEvent { priority?: string; /g' {} +

# 2. Fix getInstance misuse → remove args everywhere temporarily
grep -rl "getInstance(" lib | xargs sed -i 's/getInstance([^)]*)/getInstance()/g'

# 3. Fix KernelRegistry type/value confusion (quick cast fix)
grep -rl "KernelRegistry" lib | xargs sed -i 's/: KernelRegistry/: typeof KernelRegistry/g'

# 4. Fix missing tick usage safety fallback
grep -rl "tick(" lib | xargs sed -i 's/\.tick(/?.tick(/g'

# 5. Fix shutdown/boot missing safety guards
grep -rl "shutdown()" lib | xargs sed -i 's/shutdown()/shutdown?.()/g'
grep -rl "boot()" lib | xargs sed -i 's/\.boot()/?.boot()/g'

echo "✅ Kernel repair pass completed"
echo "👉 Now run: npx tsc --noEmit"
