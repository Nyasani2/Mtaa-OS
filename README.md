# MTAA Auth Unification — ALL Apps Recognize User

## The Problem
200+ files import auth from 5+ different paths. Some paths are broken:
- `useIdentity` from `@/lib/auth/store/auth.store` ← DOES NOT EXIST
- `useAuth` from `@/lib/auth` ← Returns non-existent `profile`/`refreshSession`
- `/auth/login`, `/auth/signup` routes ← 404 (route group doesn't appear in URL)

## The Solution

### ONE canonical import for ALL apps:
```ts
import { useCurrentUser } from '@/lib/auth';

function MyAppScreen() {
  const { user, userId, isAuthenticated, isLoading } = useCurrentUser();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <LoginPrompt />;

  // user.id, user.email available here
}
```

### Alternative: Direct store access (for selectors)
```ts
import { useAuthStore } from '@/lib/auth/store/auth.store';

const userId = useAuthStore((s) => s.user?.id);
```

## Install

```bash
cd ~/MTAA_OS_V10
unzip -o ~/Downloads/mtaa-auth-unified.zip

# Replace auth barrel
cp lib/auth/index.ts.new lib/auth/index.ts

# Add unified hook
cp lib/auth/use-current-user.ts.new lib/auth/use-current-user.ts

# Fix legacy hook redirect
cp lib/hooks/useIdentity.ts.new lib/hooks/useIdentity.ts

# Run mass fix across ALL files
bash scripts/mtaa-auth-mass-fix.sh

# Verify
bash scripts/mtaa-auth-verify.sh

# Clean and restart
rm -rf .expo node_modules/.cache
npx expo start --clear
```

## What Changed

| File | Change |
|------|--------|
| `lib/auth/index.ts` | Unified barrel: exports `useAuthStore`, `useAuth`, `useCurrentUser`, `useIdentity`, `IdentityProvider` |
| `lib/auth/use-current-user.ts` | NEW — single hook every app uses to get user |
| `lib/auth/useAuth.ts` | Fixed — removed `profile` and `refreshSession` |
| `lib/hooks/useIdentity.ts` | Redirects to canonical `@/lib/auth/identity-provider` |
| 200+ app files | Broken imports auto-fixed by mass script |

## Rule for ALL Future Apps

**ALWAYS** import user recognition from ONE of these two paths:

```ts
// Option A: Unified hook (recommended for screens)
import { useCurrentUser } from '@/lib/auth';
const { user, userId, isAuthenticated } = useCurrentUser();

// Option B: Direct store (recommended for selectors/performance)
import { useAuthStore } from '@/lib/auth/store/auth.store';
const userId = useAuthStore((s) => s.user?.id);
```

**NEVER** import from:
- `@/lib/auth/store/auth.store` for `useIdentity`
- `@/lib/auth` for `useAuth` (unless you know it's fixed)
- `@/lib/hooks/useIdentity` (legacy)
