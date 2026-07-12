#!/bin/bash
# MTAA OS V10 — Production Auth Fix Installer
# Run this after extracting the ZIP

cd ~/MTAA_OS_V10

echo "=== BACKING UP CURRENT FILES ==="
BACKUP_DIR=".backup/auth_production_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp lib/auth/store/auth.store.ts "$BACKUP_DIR/" 2>/dev/null
cp lib/hooks/useIdentity.ts "$BACKUP_DIR/" 2>/dev/null
cp lib/hooks/useAdmin.ts "$BACKUP_DIR/" 2>/dev/null
cp lib/hooks/useAuth.ts "$BACKUP_DIR/" 2>/dev/null
cp lib/hooks/index.ts "$BACKUP_DIR/" 2>/dev/null
cp lib/auth/use-identity.ts "$BACKUP_DIR/" 2>/dev/null
cp lib/auth/index.ts "$BACKUP_DIR/" 2>/dev/null
cp lib/auth/useAuth.ts "$BACKUP_DIR/" 2>/dev/null
cp app/_layout.tsx "$BACKUP_DIR/" 2>/dev/null
echo "✅ Backed up to $BACKUP_DIR"

echo ""
echo "=== INSTALLING PRODUCTION AUTH FIX ==="

# Ensure directories
mkdir -p lib/auth/store
mkdir -p lib/hooks

# Copy fixed files
cp mtaa_auth_production_fix/auth.store.ts lib/auth/store/auth.store.ts
cp mtaa_auth_production_fix/useIdentity.ts lib/hooks/useIdentity.ts
cp mtaa_auth_production_fix/useAdmin.ts lib/hooks/useAdmin.ts
cp mtaa_auth_production_fix/useAuth.ts lib/hooks/useAuth.ts
cp mtaa_auth_production_fix/hooks-index.ts lib/hooks/index.ts
cp mtaa_auth_production_fix/use-identity.ts lib/auth/use-identity.ts
cp mtaa_auth_production_fix/auth-index.ts lib/auth/index.ts
cp mtaa_auth_production_fix/useAuth.ts lib/auth/useAuth.ts
cp mtaa_auth_production_fix/_layout.tsx app/_layout.tsx

echo "✅ Files installed"

echo ""
echo "=== CLEANING UP DUPLICATES ==="
bash mtaa_auth_production_fix/cleanup.sh

echo ""
echo "=== INSTALL COMPLETE ==="
echo "Run: npx expo start --clear"
