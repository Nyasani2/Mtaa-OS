#!/bin/bash
set -e

echo "=== MTAA Import Cleanup ==="

# Fix auth store imports
echo "Fixing auth store imports..."
find app lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i.bak 's|@/hooks/useAuthStore|@/lib/auth/useAuthStore|g' {} + 2>/dev/null || true

# Fix kernel auth imports
echo "Fixing kernel auth imports..."
find app lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i.bak 's|@/lib/kernel/auth/|@/lib/auth/|g' {} + 2>/dev/null || true

# Fix kernel stores imports
echo "Fixing kernel stores imports..."
find app lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i.bak 's|@/lib/kernel/stores/|@/lib/stores/|g' {} + 2>/dev/null || true

# Remove CDN imports (esm.sh)
echo "Removing CDN imports..."
find app lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i.bak '/esm.sh/d' {} + 2>/dev/null || true

# Fix supabase client imports
echo "Fixing supabase imports..."
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i.bak 's|from "@/lib/supabase"|from "@/lib/supabase/client"|g' {} + 2>/dev/null || true

# Remove _STAGING imports
echo "Removing _STAGING imports..."
find app lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i.bak 's|@/_STAGING/[^"'"'"]*|@/lib/core/wallet|g' {} + 2>/dev/null || true

# Clean up .bak files
echo "Cleaning backup files..."
find app lib -name "*.bak" -delete 2>/dev/null || true

echo "=== Done ==="
