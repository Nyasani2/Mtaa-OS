#!/bin/bash
# MTAA OS V10 Cleanup Script
# Backs up .bak/.backup files, then removes them from codebase

set -e

echo "=== MTAA OS V10 CLEANUP ==="
echo ""

# Create backup directory
BACKUP_DIR="$HOME/MTAA_OS_BACKUPS/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory: $BACKUP_DIR"

# Find and backup all .bak/.backup/.old files
echo ""
echo "=== Backing up stale files ==="

find app/ -name "*.bak" -o -name "*.backup" -o -name "*.old" | while read file; do
    target="$BACKUP_DIR/$file"
    mkdir -p "$(dirname "$target")"
    cp "$file" "$target"
    echo "  BACKUP: $file -> $target"
done

# Also backup duplicate index files
cp app/\(os\)/index.tsx.backup "$BACKUP_DIR/app/(os)/index.tsx.backup" 2>/dev/null || true
cp app/\(os\)/streets/index.tsx.backup "$BACKUP_DIR/app/(os)/streets/index.tsx.backup" 2>/dev/null || true
cp app/\(os\)/streets/index.tsx.bak "$BACKUP_DIR/app/(os)/streets/index.tsx.bak" 2>/dev/null || true
cp app/\(os\)/streets/_layout.tsx.bak "$BACKUP_DIR/app/(os)/streets/_layout.tsx.bak" 2>/dev/null || true
cp app/\(os\)/streets/components/FeedCard.tsx.backup "$BACKUP_DIR/app/(os)/streets/components/FeedCard.tsx.backup" 2>/dev/null || true

echo ""
echo "=== Removing stale files from codebase ==="

# Remove .bak files
find app/ -name "*.bak" -delete && echo "  Removed *.bak files"
find app/ -name "*.backup" -delete && echo "  Removed *.backup files"
find app/ -name "*.old" -delete && echo "  Removed *.old files"

echo ""
echo "=== Cleanup complete ==="
echo "Backups stored in: $BACKUP_DIR"
echo ""
echo "To restore: cp -r $BACKUP_DIR/app/* app/"
