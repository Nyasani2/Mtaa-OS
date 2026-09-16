#!/usr/bin/env bash
# MTAA Health - Export health tables to backups/ as CSV
source .env 2>/dev/null || true
STAMP=$(date +%Y%m%d_%H%M%S)
OUT="backups/export_${STAMP}"
mkdir -p "$OUT"
TABLES="health_patients health_staff health_facilities health_appointments health_prescriptions health_lab_tests"
if [ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null 2>&1; then
  for T in $TABLES; do
    psql "$DATABASE_URL" -c "\copy $T TO '$OUT/$T.csv' CSV HEADER" && echo "✅ $T.csv"
  done
else
  echo "⚠️  needs DATABASE_URL + psql"
fi
