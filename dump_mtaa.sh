#!/bin/bash
OUTDIR="./mtaa_dump_$(date +%Y%m%d_%H%M%S)"
mkdir -p $OUTDIR

echo "=== BACKEND TABLES ===" > $OUTDIR/backend.txt
psql $DATABASE_URL -c "\dt public.*" >> $OUTDIR/backend.txt 2>/dev/null

echo -e "\n=== TABLE ROW COUNTS ===" >> $OUTDIR/backend.txt
psql $DATABASE_URL -c "SELECT tablename, (SELECT count(*) FROM pg_class WHERE relname=tablename) as rows FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" >> $OUTDIR/backend.txt 2>/dev/null

echo -e "\n=== EDGE FUNCTIONS ===" >> $OUTDIR/backend.txt
supabase functions list >> $OUTDIR/backend.txt 2>/dev/null

echo "=== FRONTEND TREE ===" > $OUTDIR/frontend.txt
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" -o -name "*.css" -o -name "*.json" -o -name "*.sql" -o -name "*.html" \) | grep -v node_modules | grep -v ".next" | grep -v "dist" | sort >> $OUTDIR/frontend.txt

echo "=== APP ROUTES ===" >> $OUTDIR/frontend.txt
find ./app -type f \( -name "page.tsx" -o -name "layout.tsx" -o -name "route.ts" -o -name "route.js" \) 2>/dev/null | sort >> $OUTDIR/frontend.txt

echo "Dump complete: $OUTDIR"
