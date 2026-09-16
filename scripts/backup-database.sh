#!/usr/bin/env bash
# MTAA Health - Database backup -> backups/ folder
set -u
source .env 2>/dev/null || true
STAMP=$(date +%Y%m%d_%H%M%S)
OUT="backups/mtaa_health_${STAMP}.dump"
mkdir -p backups
echo "💾 Backing up database -> $OUT"
if command -v supabase >/dev/null 2>&1; then
  supabase db dump --file "$OUT.sql" && echo "✅ supabase dump: $OUT.sql" && exit 0
fi
if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" -Fc -f "$OUT" && echo "✅ pg_dump: $OUT" && exit 0
fi
echo "⚠️  No supabase CLI and no DATABASE_URL - backup skipped."
