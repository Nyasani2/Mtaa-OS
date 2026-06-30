# Profile Complete Fix — MTAA OS V10

## What Was Broken

1. **Auth store queried `profiles` table** — but your schema has `user_profiles`. Profile was always `null`.
2. **Profile index imported from `@/lib/supabase/client`** — file doesn't exist. Should be `@/lib/supabase`.
3. **`refreshProfile` didn't exist** in auth store — Profile index called it, got `undefined`.
4. **Edit screen never refreshed auth store** after save — new avatar not reflected on Profile index.

## What Was Fixed

| File | Fix |
|------|-----|
| `lib/auth/store/auth.store.ts` | Query `user_profiles` instead of `profiles`; added `refreshProfile()` method |
| `app/(os)/profile/index.tsx` | Fixed import path; `refreshProfile` now works |
| `app/(os)/profile/edit.tsx` | Calls `refreshProfile()` after avatar upload + after profile save |

## Install

```bash
cd ~/MTAA_OS_V10
mv ~/Downloads/profile-complete-fix.zip ./
unzip -o profile-complete-fix.zip
npx tsc --noEmit
rm profile-complete-fix.zip
```

## Test

1. Open Profile — your name, bio, avatar should now load (was blank before)
2. Tap Edit Profile
3. Change avatar — upload should work, avatar stays visible
4. Tap Save — should save and navigate back
5. Profile index should show new avatar immediately
