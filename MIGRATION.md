# MTAA OS V10 — Migration Guide

## Order of Operations (DO NOT SKIP)

### Step 1: Commit current state
cd ~/MTAA_OS_V10
git add -A
git commit -m "pre-auth-repair backup"

### Step 2: Run cleanup
chmod +x cleanup_duplicates.sh
./cleanup_duplicates.sh

### Step 3: Apply SQL fixes
# Open Supabase SQL Editor, paste contents of sql_fixes.sql, run

### Step 4: Remove old frontend files
rm -f app/_layout.tsx
rm -rf lib/auth/* lib/shell/* lib/kernel/* lib/security/* lib/apps-store/*
rm -f lib/stores/auth-store.ts

### Step 5: Create directories
mkdir -p lib/auth lib/shell lib/kernel lib/security lib/apps-store

### Step 6: Extract packages IN ORDER
# Download all 4 ZIPs to ~/Downloads
cd ~/MTAA_OS_V10
unzip -o ~/Downloads/mtaa_fix_1_core_auth_kernel.zip -d .
unzip -o ~/Downloads/mtaa_fix_2_auth_screens.zip -d .
unzip -o ~/Downloads/mtaa_fix_3_appstore_registry.zip -d .

### Step 7: Fix imports in existing screens
sed -i "s/useAuthStore/useIdentity/g" app/auth/*.tsx 2>/dev/null || true
sed -i "s/useAuth/useIdentity/g" app/auth/*.tsx 2>/dev/null || true
sed -i "s|from '@/lib/stores/auth-store'|from '@/lib/auth/use-identity'|g" app/auth/*.tsx 2>/dev/null || true

### Step 8: Clear cache and test
npx expo start --clear

### Test Checklist
- [ ] Fresh install → FirstBoot → PIN → OS
- [ ] Kill app → reopen → LockScreen → PIN → OS
- [ ] Logout → Login → OS
- [ ] AppStore shows all 13 apps
- [ ] No Metro bundler warnings
