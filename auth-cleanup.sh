#!/bin/bash
# MTAA Auth Cleanup Script
# Removes confirmed duplicates, orphans, and resolves router conflicts
# Run from ~/MTAA_OS_V10

set -e

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

echo "=== MTAA Auth Cleanup ==="
echo "Working in: $(pwd)"
echo ""

# Create backup directory
BACKUP_DIR="auth-cleanup-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "[1/4] Backing up files to $BACKUP_DIR/"

# Backup duplicates (old versions)
OLD_AUTH_FILES=(
  "app/auth/biometric-enroll.tsx"
  "app/auth/forgot-password.tsx"
  "app/auth/_layout.tsx"
  "app/auth/login.tsx"
  "app/auth/signup.tsx"
  "app/auth/verify-email.tsx"
)

for f in "${OLD_AUTH_FILES[@]}"; do
  if [ -f "$f" ]; then
    cp --parents "$f" "$BACKUP_DIR/"
    echo "  Backed up: $f"
  fi
done

# Backup orphans
ORPHAN_FILES=(
  "app/auth/callback.tsx"
  "app/auth/confirm.tsx"
  "app/auth/index.tsx"
  "app/auth/kyc-review.tsx"
  "app/auth/lock-screen.tsx"
  "app/auth/reset-password.tsx"
)

for f in "${ORPHAN_FILES[@]}"; do
  if [ -f "$f" ]; then
    cp --parents "$f" "$BACKUP_DIR/"
    echo "  Backed up orphan: $f"
  fi
done

# Backup specific deletes
SPECIFIC_DELETES=(
  "app/(os)/wallet/onboarding/pin-create.tsx"
  "app/auth/lock-screen.tsx"
  "app/auth/biometric-enroll.tsx"
)

for f in "${SPECIFIC_DELETES[@]}"; do
  if [ -f "$f" ]; then
    cp --parents "$f" "$BACKUP_DIR/"
    echo "  Backed up specific: $f"
  fi
done

# Backup router conflict (the one we'll delete)
if [ -f "app/(os)/settings/biometric.tsx" ]; then
  cp --parents "app/(os)/settings/biometric.tsx" "$BACKUP_DIR/"
  echo "  Backed up conflict: app/(os)/settings/biometric.tsx"
fi

echo ""
echo "[2/4] Removing old duplicate auth files..."
for f in "${OLD_AUTH_FILES[@]}"; do
  if [ -f "$f" ]; then
    rm "$f"
    echo "  DELETED: $f"
  else
    echo "  Already gone: $f"
  fi
done

echo ""
echo "[3/4] Removing orphan auth files..."
for f in "${ORPHAN_FILES[@]}"; do
  if [ -f "$f" ]; then
    rm "$f"
    echo "  DELETED: $f"
  else
    echo "  Already gone: $f"
  fi
done

echo ""
echo "[4/4] Removing specific superseded files + resolving router conflict..."

# Remove pin-create (superseded by Phase 2)
if [ -f "app/(os)/wallet/onboarding/pin-create.tsx" ]; then
  rm "app/(os)/wallet/onboarding/pin-create.tsx"
  echo "  DELETED: app/(os)/wallet/onboarding/pin-create.tsx"
fi

# Remove flat biometric.tsx — keep biometric/index.tsx (folder route wins in Expo Router)
if [ -f "app/(os)/settings/biometric.tsx" ]; then
  rm "app/(os)/settings/biometric.tsx"
  echo "  DELETED: app/(os)/settings/biometric.tsx (conflict resolved, keeping biometric/index.tsx)"
fi

# Clean up empty app/auth/ directory if nothing left
if [ -d "app/auth" ]; then
  REMAINING=$(ls -A app/auth/ 2>/dev/null | wc -l)
  if [ "$REMAINING" -eq 0 ]; then
    rmdir "app/auth"
    echo "  REMOVED empty directory: app/auth/"
  else
    echo "  WARN: app/auth/ still has $REMAINING files — review manually"
    ls -la app/auth/
  fi
fi

echo ""
echo "=== Cleanup Complete ==="
echo "Backup saved to: $BACKUP_DIR/"
echo ""
echo "Next steps:"
echo "  1. Run: npx expo start --clear"
echo "  2. Test auth flow: login → PIN → biometric → OS shell"
echo "  3. If anything breaks, restore from $BACKUP_DIR/"
