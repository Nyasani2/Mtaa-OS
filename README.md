# PIN Engine Fix

## Problem
```
_ExpoSecureStore.default.getValueWithKeyAsync is not a function
```

This crashes during:
- OS boot (`os-shell-provider.tsx`)
- Auth state change (`identity-provider.tsx`)
- Login (`login.tsx`)

## Root Cause
`expo-secure-store` import is broken or the module isn't properly installed/configured for web preview.

## Fix Applied
1. Wrapped all SecureStore calls in `safeGetItem` / `safeSetItem` / `safeDeleteItem`
2. Falls back to `localStorage` on web / Node.js where SecureStore is unavailable
3. Added null checks: `SecureStore?.getItemAsync` before calling
4. Logs warnings instead of crashing
5. Preserved all PIN logic: hashing, attempts, lockout

## Install
```bash
cd /tmp && rm -rf module_fix && mkdir module_fix && cd module_fix
unzip ~/Downloads/pin-engine-fix.zip
cp lib/security/pin-engine.ts ~/MTAA_OS_V10/lib/security/pin-engine.ts
cd ~/MTAA_OS_V10 && npx expo start --clear
```

## Note
For production native builds, ensure `expo-secure-store` is in your app.json plugins:
```json
{
  "plugins": ["expo-secure-store"]
}
```
