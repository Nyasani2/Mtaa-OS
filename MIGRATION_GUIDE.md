# MTAA OS V10 — Auth Architecture Migration Guide

## What Changed

### Old Architecture (BROKEN)
```
┌─────────────────────────────────────────┐
│  useAuth hook ──→ supabase.auth         │
│  useAuthStore ──→ supabase.auth         │  ← 4+ duplicate listeners!
│  auth-kernel ──→ supabase.auth          │
│  auth-bridge ──→ supabase.auth          │
│  useUser hook ──→ supabase.auth         │
└─────────────────────────────────────────┘
         ↓
    Race conditions, flickering, crashes
```

### New Architecture (CLEAN)
```
┌─────────────────────────────────────────┐
│  LAYER 1: IDENTITY ENGINE               │
│  lib/auth/identity.ts                   │
│  • ONE supabase.auth listener           │
│  • Module-level reactive state          │
│  • No Zustand for session               │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  LAYER 2: PIN ENGINE                    │
│  lib/security/pin-engine.ts             │
│  • AsyncStorage only                    │
│  • Device lock, NOT login               │
│  • Biometric support                    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  LAYER 3: OS GATE                       │
│  lib/auth/os-gate.tsx                   │
│  • Blocks (os) routes                   │
│  • Shows lock screen                    │
│  • Redirects to login                   │
└─────────────────────────────────────────┘
```

## File Map

| Old File | Action | New File |
|----------|--------|----------|
| `lib/stores/auth-store.ts` | **DELETE** | `lib/auth/identity.ts` |
| `hooks/useAuthStore.ts` | **DELETE** | `lib/auth/identity.ts` |
| `lib/auth/auth-kernel.ts` | **DELETE** | `lib/auth/identity.ts` |
| `lib/auth/auth-bridge.ts` | **DELETE** | `lib/auth/identity.ts` |
| `lib/auth/use-auth-boot.ts` | **DELETE** | Boot in `app/_layout.tsx` |
| `lib/security/pin-store.ts` | **DELETE** | `lib/security/pin-engine.ts` |
| `app/_layout.tsx` | **REPLACE** | New version (single listener) |
| `app/(os)/_layout.tsx` | **REPLACE** | New version (with OSGate) |
| `app/auth/login.tsx` | **REPLACE** | New version (use identityEngine) |
| `app/auth/set-pin.tsx` | **REPLACE** | New version (use pinEngine) |
| `hooks/useAuth.ts` | **KEEP** (deprecated) | Gradually migrate to `useIdentity` |

## Import Migration

### Before
```tsx
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuth } from "@/hooks/useAuth";
import { pinStore } from "@/lib/security/pin-store";
```

### After
```tsx
import { useIdentity, identityEngine } from "@/lib/auth/identity";
import { usePinVerified, pinEngine } from "@/lib/security/pin-engine";
```

## API Changes

### Session Access
```tsx
// OLD (Zustand)
const session = useAuthStore((s) => s.session);

// NEW (identityEngine)
const { session, user, isLoading } = useIdentity();
// OR imperative:
const { session } = identityEngine.getState();
```

### Sign In
```tsx
// OLD
const { signIn } = useAuth();
await signIn(email, password);

// NEW
import { identityEngine } from "@/lib/auth/identity";
await identityEngine.signIn(email, password);
```

### Sign Out
```tsx
// OLD
const { signOut } = useAuth();
await signOut();

// NEW
import { identityEngine } from "@/lib/auth/identity";
await identityEngine.signOut();
// PIN lock is automatically cleared
```

### PIN Operations
```tsx
// OLD (Zustand — WRONG)
import { pinStore } from "@/lib/security/pin-store";
pinStore.setPin(pin);

// NEW (AsyncStorage)
import { pinEngine } from "@/lib/security/pin-engine";
await pinEngine.setPin(pin);
await pinEngine.verifyPin(pin);
await pinEngine.biometricUnlock();
await pinEngine.lock();
```

## Boot Flow

```
App Launch
    ↓
app/_layout.tsx mounts
    ↓
identityEngine.boot() — checks Supabase session
    ↓
identityEngine.startListener() — ONE auth listener
    ↓
Routes render
    ↓
app/(os)/_layout.tsx mounts
    ↓
OSGate checks:
    1. Session exists? → No → redirect /auth/login
    2. PIN enabled?  → No  → render OS
    3. PIN verified? → No  → show LockScreen
    4. All pass      → Yes → render OS
```

## Testing Checklist

- [ ] Fresh install → shows login screen
- [ ] Login with valid creds → enters OS
- [ ] Background app → foreground → shows lock screen (if PIN set)
- [ ] Wrong PIN 5 times → signs out automatically
- [ ] Biometric unlock → works (if enrolled)
- [ ] No PIN set → enters OS directly after login
- [ ] Set PIN from settings → works
- [ ] Sign out → clears session + PIN verification
