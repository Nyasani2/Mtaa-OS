#!/bin/bash
# MTAA OS V10 — Duplicate Cleanup Script
# Run BEFORE applying new auth/kernel files
set -e

echo "🔧 MTAA OS V10 — Cleanup"
PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

BEFORE=$(find . -type f | wc -l)
echo "📁 Files before: $BEFORE"

# Remove backup directories
echo "🗑️  Removing backups..."
find . -type d -name ".backup*" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "*.backup" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".backup-*" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "_CLEANUP_BACKUP*" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "_KERNEL_ARCHIVE_LOCK*" -exec rm -rf {} + 2>/dev/null || true
find . -type d -path "*/mtaa/zip*" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "zip[0-9]*" -exec rm -rf {} + 2>/dev/null || true

# Remove duplicate ASIS layers
find . -type d -path "*/kernel/ai/asis-*" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "asis-core.ts" -not -path "*/asis/*" -delete 2>/dev/null || true
find . -type f -name "asis-live.ts" -not -path "*/asis/*" -delete 2>/dev/null || true
find . -type f -name "asis-engine.ts" -not -path "*/asis/*" -delete 2>/dev/null || true

# Remove old auth stores
find . -type f -name "auth-store.ts" -path "*/stores/*" -delete 2>/dev/null || true
find . -type f -name "useAuth.ts" -delete 2>/dev/null || true
find . -type f -name "useAuthStore.ts" -delete 2>/dev/null || true

# Remove old registry files
find . -type f -name "registry.ts" -path "*/appstore/*" -delete 2>/dev/null || true
find . -type f -name "registry.ts" -path "*/apps-store/*" -not -path "*/unified-registry*" -delete 2>/dev/null || true

# Remove duplicate shell/identity
find . -type f -name "os-shell.ts" -not -path "*/shell/*" -delete 2>/dev/null || true
find . -type f -name "identity.ts" -not -path "*/auth/identity.ts" -delete 2>/dev/null || true

AFTER=$(find . -type f | wc -l)
REMOVED=$((BEFORE - AFTER))
echo "✅ Done! Files after: $AFTER | Removed: $REMOVED"
echo "Next: git add -A && git commit -m 'cleanup duplicates'"
