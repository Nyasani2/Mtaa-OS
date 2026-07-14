#!/bin/bash
# MTAA OS V10 — Cleanup Auth Backup Folders
# Run: cd ~/MTAA_OS_V10 && bash cleanup_auth_backups.sh

echo "Cleaning up auth backup folders..."

# Remove backup folders
rm -rf .backup/auth_pin_fix_20260712_130146
rm -rf .backup/auth_production_20260712_080351
rm -rf .backup/lock_system_20260712_082405
rm -rf .backup/lock_system_20260712_085042
rm -rf .backup/pin_system_v3_20260712_142619
rm -rf .backup/health_roles_20260704_191051
rm -rf mtaa_auth_pin_fix
rm -rf mtaa_auth_production_fix
rm -rf mtaa_auth_store_fix
rm -rf mtaa_os_lock_system
rm -rf mtaa_os_lock_system_v2
rm -rf mtaa_pin_system_v3

# Remove ZIP files
rm -f mtaa_auth_pin_fix.zip
rm -f mtaa_auth_production_fix.zip
rm -f mtaa_auth_store_fix.zip
rm -f mtaa_pin_system_v3.zip

# Remove old wallet backup
rm -rf app/(os)/wallet_backup_20260710_190903

# Remove old messages backup
rm -f app/(os)/messages/.backup_v2_index.tsx

echo "Cleanup complete. Remaining auth files:"
find . -maxdepth 2 -name "*auth*" -o -name "*pin*" -o -name "*lock*" 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "android" | sort
