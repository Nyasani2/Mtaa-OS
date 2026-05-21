#!/bin/bash
# MTAA Phase 2 Cleanup — Extraction Script
# Run this FIRST before anything else

set -e

PROJECT_DIR="$HOME/MTAA_OS_V10"
PHASE2_DIR="$PROJECT_DIR/.phase2-cleanup"
BACKUP_DIR="$PROJECT_DIR/.backup-$(date +%Y%m%d_%H%M%S)"

echo "=========================================="
echo "  MTAA OS — Phase 2 Cleanup Extractor"
echo "=========================================="
echo ""

# 1. Backup existing project
echo "[1/5] Creating backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r "$PROJECT_DIR/app" "$BACKUP_DIR/app" 2>/dev/null || true
cp -r "$PROJECT_DIR/lib" "$BACKUP_DIR/lib" 2>/dev/null || true
cp -r "$PROJECT_DIR/hooks" "$BACKUP_DIR/hooks" 2>/dev/null || true
cp -r "$PROJECT_DIR/components" "$BACKUP_DIR/components" 2>/dev/null || true
cp "$PROJECT_DIR/package.json" "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR/tsconfig.json" "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Backup complete"

# 2. Create .phase2-cleanup staging area
echo "[2/5] Staging Phase 2 files..."
mkdir -p "$PHASE2_DIR"

# 3. Copy all files from this ZIP into staging
echo "[3/5] Copying new files to staging..."
# (Files are already extracted by unzip, this script runs after)

# 4. Show what will change
echo "[4/5] Files to be applied:"
find . -type f | grep -v EXTRACT_FIRST.sh | sort

echo ""
echo "[5/5] Ready to apply. Run:"
echo "  cd $PROJECT_DIR/.phase2-cleanup"
echo "  bash APPLY_CHANGES.sh"
echo ""
echo "=========================================="
