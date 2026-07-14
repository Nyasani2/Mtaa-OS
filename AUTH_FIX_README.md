# MTAA OS V10 — Auth Production Fix v2

## What This Fix Does

1. **Replaces `lock-screen.tsx`** with a production-ready custom keypad (no more broken `TextInput`)
2. **Fixes `app/os/streets/feed.tsx`** — `useAuth()` → `useAuthStore()` (was crashing)
3. **Cleans up 7 backup auth folders** — prevents conflicts and confusion

## Install Steps

```bash
cd ~/MTAA_OS_V10

# 1. Extract the ZIP
unzip -o ~/Downloads/mtaa_auth_production_fix_v2.zip -d .

# 2. Run cleanup
bash cleanup_auth_backups.sh

# 3. Verify no conflicts
git status

# 4. Test the build
npx expo start --clear
```

## Lock Screen Features

- ✅ Custom 3x4 keypad (0-9, backspace) — same as set-pin
- ✅ Visual PIN dots (6 dots, fill as you type)
- ✅ Auto-submit on 4th-6th digit (no button needed)
- ✅ Haptic feedback on wrong PIN
- ✅ 5-attempt lockout with countdown timer
- ✅ Forgot PIN → logout → re-login flow
- ✅ Dark/light mode support
- ✅ Disabled state during lockout/loading

## Files Changed

| File | Action |
|------|--------|
| `app/auth/lock-screen.tsx` | **Replaced** — custom keypad, no TextInput |
| `app/os/streets/feed.tsx` | **Fixed** — `useAuth()` → `useAuthStore()` |
| `cleanup_auth_backups.sh` | **New** — removes 7 backup folders |

## Next Steps

After this fix:
1. Test PIN setup → lock → unlock cycle
2. Test forgot PIN flow
3. Test streets feed loads without crash
4. Continue with dead buttons and edge functions
