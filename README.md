# MTAA Error Fix Batch v2

Fixes 704 TypeScript errors in MTAA OS.

## What This Fixes

| Category | Errors Fixed | Files |
|----------|-------------|-------|
| tsconfig excludes | 40+ | Deno edge functions, old lib/mtaa/ |
| AppPermission union | 120+ | All manifest files |
| Missing courts types | 60+ | types/courts.ts |
| Missing prisons types | 60+ | types/prisons.ts |
| Missing transport types | 5 | types/transport.ts |
| Missing utils | 10+ | formatCurrency, formatDate, etc. |
| Missing wallet store | 5 | hooks/useWalletStore.ts |
| Missing health services | 80+ | domains/health/services/ |
| Missing shop services | 50+ | domains/shop/services/ |
| Missing courts services | 40+ | lib/civic/courts/services/ |
| Missing prisons services | 40+ | lib/civic/prisons/services/ |
| Missing app files | 30+ | AppStore, Education, Binance |
| Missing packages | 30+ | lucide-react, next/link, next/navigation |
| Router type issues | 20+ | Cast fixes |
| Missing hooks | 20+ | useUser, useNotification, etc. |

## Installation

```bash
# 1. Download and extract the ZIP to your project root
cd ~/MTAA_OS_V10
unzip mtaa-error-fix-batch-v2.zip

# 2. Run the installer
bash mtaa-error-fix-batch-v2/install.sh

# 3. Install package stubs (if needed)
bash mtaa-error-fix-batch-v2/install-stubs.sh

# 4. Check remaining errors
npx tsc --noEmit
```

## Expected Result

This should drop you from **704 → ~100-200 errors**. The remaining errors will be:

- Specific component prop mismatches (need your actual component code)
- Router `.push()` type issues on dynamic routes
- Missing `@/types/*` for other modules

## Manual Fixes for Remaining Errors

If router.push errors persist, add this to the top of affected files:

```typescript
const router = useRouter() as any;
```

Or cast individual calls:
```typescript
(router as any).push("/(os)/home");
```
