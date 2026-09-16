#!/usr/bin/env bash
# MTAA Health - Scaffold a new timestamped migration
NAME="${1:-new_migration}"
STAMP=$(date +%Y%m%d%H%M%S)
DIR="migrations"
mkdir -p "$DIR"
FILE="$DIR/${STAMP}_${NAME}.sql"
cat > "$FILE" << EOF
-- Migration: ${NAME}
-- Created: $(date)
-- Safe/idempotent rules: CREATE ... IF NOT EXISTS, DROP ... IF EXISTS, guard policies with DO blocks.
begin;

-- write your SQL here

commit;
EOF
echo "✅ created $FILE"
