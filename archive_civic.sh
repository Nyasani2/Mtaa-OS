#!/bin/bash
# ============================================================
# ARCHIVE CIVIC MODULES FROM GIT HISTORY
# Run this to recover deleted civic files into archive/civic/
# ============================================================
cd ~/MTAA_OS_V10

# Get the commit BEFORE the deletion (parent of current HEAD)
ARCHIVE_COMMIT=$(git rev-parse HEAD^)
echo "Archiving civic files from commit: $ARCHIVE_COMMIT"

# Create archive directory
mkdir -p archive/civic

# Restore deleted files from git history into archive/
git show $ARCHIVE_COMMIT:app/\(civic\)/_layout.tsx > archive/civic/app_layout.tsx 2>/dev/null || true

# Better: checkout the entire deleted directories from the parent commit
git checkout $ARCHIVE_COMMIT -- app/\(civic\)/ 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- domains/civic/ 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- lib/civic/ 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- backend/sql/026_mtaa_civic_layer.sql 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- civic_full_rebuild_v2.sql 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- sql/civic-v2-schema.sql 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- sql/civic_courts_trigger_fix.sql 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- supabase/functions/civic-audit-log/ 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- supabase/functions/civic-notification-router/ 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- supabase/functions/civic-operations/ 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- supabase/functions/police-to-court-handoff/ 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- supabase/functions/treasury-router/ 2>/dev/null || true
git checkout $ARCHIVE_COMMIT -- supabase/migrations/20240601000006_civic_modules.sql 2>/dev/null || true

# Move recovered files into archive/
mkdir -p archive/civic/app archive/civic/domains archive/civic/lib archive/civic/sql archive/civic/supabase/functions archive/civic/supabase/migrations

mv app/\(civic\)/ archive/civic/app/ 2>/dev/null || true
mv domains/civic/ archive/civic/domains/ 2>/dev/null || true
mv lib/civic/ archive/civic/lib/ 2>/dev/null || true
mv backend/sql/026_mtaa_civic_layer.sql archive/civic/sql/ 2>/dev/null || true
mv civic_full_rebuild_v2.sql archive/civic/sql/ 2>/dev/null || true
mv sql/civic-v2-schema.sql archive/civic/sql/ 2>/dev/null || true
mv sql/civic_courts_trigger_fix.sql archive/civic/sql/ 2>/dev/null || true
mv supabase/functions/civic-audit-log/ archive/civic/supabase/functions/ 2>/dev/null || true
mv supabase/functions/civic-notification-router/ archive/civic/supabase/functions/ 2>/dev/null || true
mv supabase/functions/civic-operations/ archive/civic/supabase/functions/ 2>/dev/null || true
mv supabase/functions/police-to-court-handoff/ archive/civic/supabase/functions/ 2>/dev/null || true
mv supabase/functions/treasury-router/ archive/civic/supabase/functions/ 2>/dev/null || true
mv supabase/migrations/20240601000006_civic_modules.sql archive/civic/supabase/migrations/ 2>/dev/null || true

# Add archive to gitignore so it doesn't get built
if ! grep -q "^archive/" .gitignore; then
  echo "" >> .gitignore
  echo "# ARCHIVED MODULES (not in active build)" >> .gitignore
  echo "archive/" >> .gitignore
fi

echo "=== Civic archived to archive/civic/ ==="
find archive/civic -type f | wc -l
echo "files archived"
