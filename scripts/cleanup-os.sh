#!/bin/bash

echo "[MTAA CLEANUP OS] Starting..."

# Kernel normalization rules
echo "Enforcing single kernel runtime path..."

# Mark secondary kernels as archive-only
mkdir -p _KERNEL_ARCHIVE_LOCK

if [ -d "_KERNEL_BACKUP_ARCHIVE" ]; then
  mv _KERNEL_BACKUP_ARCHIVE _KERNEL_ARCHIVE_LOCK/backup_kernel_archive
fi

if [ -d "_STAGING" ]; then
  mv _STAGING _KERNEL_ARCHIVE_LOCK/staging_area
fi

echo "Cleaning duplicate build artifacts..."
rm -rf node_modules/.cache 2>/dev/null

echo "Kernel cleanup complete. Active kernel should remain in lib/kernel"

echo "DONE"
