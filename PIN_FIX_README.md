# PIN Fix — Complete PIN System Overhaul

## Problems Fixed

### 1. PIN Lost After App Data Clear / Reinstall
**Root Cause:** PIN was stored in AsyncStorage only (local device storage). Clearing app data wiped it.
**Fix:** Added cloud backup to `user_profiles.pin_hash`. When local PIN is missing, `verifyPin()` automatically restores from cloud.

### 2. No "Forgot PIN" Recovery
**Root Cause:** Lock screen had no way to recover a lost PIN.
**Fix:** Added "Forgot PIN?" button to lock screen that clears PIN and redirects to login → set new PIN.

### 3. change-pin.tsx Stored Plain Text in Supabase
**Root Cause:** `change-pin.tsx` wrote raw PIN to `profiles.pin_hash` instead of hashing it.
**Fix:** Now uses `verifyPin()` + `setPin()` from `pin-engine.ts` — consistent hashing and cloud sync.

### 4. No Lockout Screen
**Root Cause:** After 5 failed attempts, PIN just kept failing with no lockout UI.
**Fix:** Added lockout screen showing "Try again in X minutes" with Log Out button.

## Files Changed

| File | Change |
|------|--------|
| `lib/security/pin-engine.ts` | Added cloud backup/restore, `resetPin()`, lockout handling |
| `app/auth/lock-screen.tsx` | NEW — 6-dot PIN pad with "Forgot PIN?", lockout screen, Log Out |
| `app/auth/set-pin.tsx` | NEW — Create/confirm 6-digit PIN with keypad |
| `app/(os)/settings/change-pin.tsx` | Uses `pin-engine.ts` instead of raw Supabase |

## Installation

```bash
cd ~/MTAA_OS_V10

# Backup existing
mkdir -p backups/pin-fix-$(date +%Y%m%d)
cp lib/security/pin-engine.ts backups/ 2>/dev/null || true
cp app/auth/lock-screen.tsx backups/ 2>/dev/null || true
cp app/auth/set-pin.tsx backups/ 2>/dev/null || true
cp "app/(os)/settings/change-pin.tsx" backups/ 2>/dev/null || true

# Extract
unzip -o ~/Downloads/pin_fix_complete.zip -d .

# Type-check
npx tsc --noEmit 2>&1 | grep -E "(pin|lock)" | head -10
```

## How It Works Now

1. **Set PIN:** `setPin()` hashes PIN, stores in AsyncStorage + backs up to `user_profiles.pin_hash`
2. **Verify PIN:** `verifyPin()` checks AsyncStorage first → if missing, restores from cloud → compares hashes
3. **Forgot PIN:** User taps "Forgot PIN?" → `resetPin()` clears local state → logout → login → `setPin()`
4. **Change PIN:** `verifyPin(current)` → `setPin(new)` — both hashed, both synced to cloud
5. **Lockout:** After 5 failed attempts, 5-minute lockout with countdown screen

## Schema Requirement

Ensure `user_profiles` table has:
```sql
pin_hash TEXT,
pin_enabled BOOLEAN DEFAULT FALSE
```

If these columns don't exist, add them:
```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pin_enabled BOOLEAN DEFAULT FALSE;
```
