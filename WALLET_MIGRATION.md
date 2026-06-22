# MTAA Wallet Unification Migration Guide

## Problem
5+ wallet hooks exist across the codebase:
- domains/streets/hooks/useWallet.ts
- domains/wallet/hooks/useWallet.ts
- lib/identity/hooks/useWallet.ts
- lib/hooks/useWallet.ts
- hooks/useWallet.ts

## Solution
ONE unified hook at: `lib/identity/hooks/useWallet.ts`

## Migration Steps

### Step 1: Replace all old hooks
```bash
# Delete old hooks
rm domains/streets/hooks/useWallet.ts
rm domains/wallet/hooks/useWallet.ts
rm lib/hooks/useWallet.ts
rm hooks/useWallet.ts

# Keep only:
# lib/identity/hooks/useWallet.ts (the unified one)
```

### Step 2: Update all imports
Search and replace across codebase:

OLD:
```ts
import { useWallet } from '@/domains/streets/hooks/useWallet';
import { useWallet } from '@/domains/wallet/hooks/useWallet';
import { useWallet } from '@/lib/hooks/useWallet';
import { useWallet } from '@/hooks/useWallet';
```

NEW:
```ts
import { useWallet } from '@/lib/identity/hooks';
```

### Step 3: Update tsconfig paths (if needed)
Ensure `@/lib/identity/hooks` resolves correctly.

### Step 4: Test
- Wallet screen loads balance
- Transactions list populates
- Deposit/withdraw/transfer work
- Streets feed wallet integration works

## API Compatibility

The unified hook maintains backward compatibility:

| Old API | New API | Status |
|---------|---------|--------|
| useWallet() | useWallet() | ✅ Same |
| useWalletBalance() | useWalletBalance() | ✅ Same |
| useWalletTransactions() | useWalletTransactions() | ✅ Same |
| useStreetsWallet() | useStreetsWallet() | ✅ Same |

## New Features
- Global state sharing (no prop drilling)
- Auto-wallet creation if missing
- Built-in caching (30s TTL)
- Error boundary handling
- Escrow support
- Transfer support
