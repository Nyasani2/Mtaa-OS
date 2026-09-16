#!/usr/bin/env bash
# MTAA Health - Apply init-database.sql to Supabase
source .env 2>/dev/null || true
SQL="scripts/init-database.sql"
[ -f "$SQL" ] || { echo "⚠️  $SQL not found"; exit 0; }

echo "🗄️  Applying $SQL ..."
if command -v supabase >/dev/null 2>&1 && supabase projects list >/dev/null 2>&1; then
  supabase db push 2>/dev/null || true
fi
if [ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null 2>&1; then
  psql "$DATABASE_URL" -f "$SQL" && echo "✅ Applied via psql" && exit 0
fi
echo ""
echo "👉 Manual route (recommended):"
echo "   1. Open Supabase Dashboard -> SQL Editor"
echo "   2. Open $SQL in your code editor, copy ALL"
echo "   3. Paste into SQL Editor -> Run"
echo "   (Do NOT paste into your terminal - that is what crashed it before.)"
