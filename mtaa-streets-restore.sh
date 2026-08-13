#!/bin/bash
# Restore Streets from commit 39723e20b — the full working version
cd ~/MTAA_OS_V10

echo "=== Restoring Streets from git commit 39723e20b ==="

# Restore the main feed (index.tsx was overwritten with a 6KB stub)
git checkout 39723e20b -- app/\(os\)/streets/index.tsx

# Restore create post screen
git checkout 39723e20b -- app/\(os\)/streets/create.tsx

# Restore search
git checkout 39723e20b -- app/\(os\)/streets/search.tsx

# Restore notifications
git checkout 39723e20b -- app/\(os\)/streets/notifications.tsx

# Restore saved
git checkout 39723e20b -- app/\(os\)/streets/saved.tsx

# Restore settings
git checkout 39723e20b -- app/\(os\)/streets/settings.tsx

# Restore creator profile
git checkout 39723e20b -- app/\(os\)/streets/creator.tsx

# Restore streets service and hook
git checkout 39723e20b -- lib/services/streets-service.ts
git checkout 39723e20b -- lib/hooks/useStreets.ts

echo ""
echo "=== Restored files ==="
git status --short app/\(os\)/streets/ lib/services/streets-service.ts lib/hooks/useStreets.ts

echo ""
echo "=== Verifying index.tsx size ==="
ls -la app/\(os\)/streets/index.tsx

echo ""
echo "Run: rm -rf .expo node_modules/.cache && npx expo start --clear"
