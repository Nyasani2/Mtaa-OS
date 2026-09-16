#!/usr/bin/env bash
# MTAA Health - Import CSVs back (path arg required)
DIR="${1:-}"
[ -d "$DIR" ] || { echo "Usage: bash scripts/import-data.sh backups/export_YYYYmmdd_HHMMSS"; exit 0; }
source .env 2>/dev/null || true
[ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null 2>&1 || { echo "⚠️  needs DATABASE_URL + psql"; exit 0; }
for F in "$DIR"/*.csv; do
  T=$(basename "$F" .csv)
  psql "$DATABASE_URL" -c "\copy $T FROM '$F' CSV HEADER" && echo "✅ imported $T"
done
