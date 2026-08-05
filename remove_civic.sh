#!/bin/bash
# ============================================================
# REMOVE ALL CIVIC APPS FROM MTAA OS V10
# ============================================================
cd ~/MTAA_OS_V10

echo "=== Step 1: Remove civic app directories ==="
rm -rf "app/(civic)"
rm -rf domains/civic
rm -rf lib/civic
rm -rf "app/(os)/civic" 2>/dev/null || true

echo "=== Step 2: Remove civic edge functions ==="
rm -rf supabase/functions/civic-* 2>/dev/null || true
rm -rf supabase/functions/border-* 2>/dev/null || true
rm -rf supabase/functions/customs-* 2>/dev/null || true
rm -rf supabase/functions/immigration-* 2>/dev/null || true
rm -rf supabase/functions/transport-* 2>/dev/null || true
rm -rf supabase/functions/agriculture-* 2>/dev/null || true
rm -rf supabase/functions/courts-* 2>/dev/null || true
rm -rf supabase/functions/prisons-* 2>/dev/null || true
rm -rf supabase/functions/police-* 2>/dev/null || true
rm -rf supabase/functions/treasury-* 2>/dev/null || true
rm -rf supabase/functions/revenue-* 2>/dev/null || true

echo "=== Step 3: Remove civic SQL files ==="
find . -name "*civic*" -type f \( -name "*.sql" -o -name "*.md" \) -not -path "./node_modules/*" -not -path "./.git/*" -delete 2>/dev/null || true

echo "=== Step 4: Add civic to .gitignore ==="
cat >> .gitignore << 'GITIGNORE'

# CIVIC APPS — REMOVED FROM OS
app/(civic)/
domains/civic/
lib/civic/
supabase/functions/civic-*
supabase/functions/border-*
supabase/functions/customs-*
supabase/functions/immigration-*
supabase/functions/transport-*
supabase/functions/agriculture-*
supabase/functions/courts-*
supabase/functions/prisons-*
supabase/functions/police-*
supabase/functions/treasury-*
supabase/functions/revenue-*
GITIGNORE

echo "=== Step 5: Remove civic exports from barrel files ==="
sed -i "/civic/d" lib/services/index.ts 2>/dev/null || true
sed -i "/border/d" lib/services/index.ts 2>/dev/null || true
sed -i "/customs/d" lib/services/index.ts 2>/dev/null || true
sed -i "/immigration/d" lib/services/index.ts 2>/dev/null || true
sed -i "/transport/d" lib/services/index.ts 2>/dev/null || true
sed -i "/agriculture/d" lib/services/index.ts 2>/dev/null || true
sed -i "/courts/d" lib/services/index.ts 2>/dev/null || true
sed -i "/prisons/d" lib/services/index.ts 2>/dev/null || true
sed -i "/police/d" lib/services/index.ts 2>/dev/null || true
sed -i "/treasury/d" lib/services/index.ts 2>/dev/null || true
sed -i "/revenue/d" lib/services/index.ts 2>/dev/null || true

echo "=== Step 6: Remove civic entries from unified registry ==="
# Remove lines containing civic module IDs from unified registry
sed -i "/agriculture/d" lib/apps-store/unified-registry.ts 2>/dev/null || true
sed -i "/border/d" lib/apps-store/unified-registry.ts 2>/dev/null || true
sed -i "/customs/d" lib/apps-store/unified-registry.ts 2>/dev/null || true
sed -i "/immigration/d" lib/apps-store/unified-registry.ts 2>/dev/null || true
sed -i "/transport/d" lib/apps-store/unified-registry.ts 2>/dev/null || true
sed -i "/courts/d" lib/apps-store/unified-registry.ts 2>/dev/null || true
sed -i "/prisons/d" lib/apps-store/unified-registry.ts 2>/dev/null || true
sed -i "/police/d" lib/apps-store/unified-registry.ts 2>/dev/null || true
sed -i "/treasury/d" lib/apps-store/unified-registry.ts 2>/dev/null || true
sed -i "/revenue/d" lib/apps-store/unified-registry.ts 2>/dev/null || true

echo "=== Step 7: Remove civic routes from root layout ==="
sed -i "/civic/d" app/_layout.tsx 2>/dev/null || true

echo "=== Step 8: Stage deletions ==="
git add -A

echo "=== Done. Civic apps removed. ==="
echo "Run: git status --short | head -30"
