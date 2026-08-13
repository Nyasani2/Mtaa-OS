#!/bin/bash
set -e
cd ~/MTAA_OS_V10

echo "=== Installing Streets Full Fix ==="

# Backup
cp app/\(os\)/streets/index.tsx app/\(os\)/streets/index.tsx.bak.full.$(date +%s) 2>/dev/null || true
cp app/\(os\)/profile/index.tsx app/\(os\)/profile/index.tsx.bak.full.$(date +%s) 2>/dev/null || true

# Install files
cp mtaa-streets-full-fix/app/\(os\)/streets/index.tsx app/\(os\)/streets/index.tsx
cp mtaa-streets-full-fix/app/\(os\)/streets/following.tsx app/\(os\)/streets/following.tsx
cp mtaa-streets-full-fix/app/\(os\)/streets/notifications.tsx app/\(os\)/streets/notifications.tsx
cp mtaa-streets-full-fix/app/\(os\)/messages/new.tsx app/\(os\)/messages/new.tsx
cp mtaa-streets-full-fix/app/\(os\)/profile/index.tsx app/\(os\)/profile/index.tsx

echo "=== Clearing cache ==="
rm -rf .expo node_modules/.cache
npx expo start --clear
