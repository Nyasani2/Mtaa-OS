# MTAA OS Gate Hotfix
## Fixes "Securing your session..." infinite loop

### What Was Broken
The new OS Gate ran a full blocking security check on EVERY route change:
- Click Calendar → gate checks → spinner
- Click Calculator → gate checks → spinner
- Every app click = spinner that never resolved

Root cause: `setChecking(false)` was skipped on early returns/redirects inside the check function.

### What Changed
**File: `lib/auth/os-gate.tsx`**

| Before | After |
|--------|-------|
| Blocking check on every route change | Only blocks on **initial app load** |
| `useEffect` depended on `currentRoute` | `useEffect` depends on `isAuthenticated` only |
| Spinner shown on every navigation | Apps open **instantly** after first load |
| Security checks ran synchronously on route change | Security checks run **in background** every 2 minutes |
| Early returns skipped `setChecking(false)` | No `checking` state at all — only `gateReady` for init |

### Security preserved
- Unauthenticated users still redirected to login
- No-PIN users still redirected to set-pin (once, on auth)
- Session timeout still enforced (monitor + background check)
- Device validation still runs every 2 minutes
- Account freeze check still runs every 2 minutes
- Step-up auth still triggers lock screen

### Install
```bash
cd ~/MTAA_OS_V10
unzip -o ~/Downloads/mtaa_auth_gate_hotfix.zip
npx expo start --clear
```

### Test
1. Load app → "Securing your session..." appears briefly (normal)
2. Home screen loads
3. Click ANY app → opens **instantly**, no spinner
4. Click 5 more apps → all open instantly
5. Background security still active (invisible to user)
