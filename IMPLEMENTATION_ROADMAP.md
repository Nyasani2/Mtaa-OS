# MTAA OS — Deployment Readiness Implementation Pack
Generated: 2026-08-14

## What's in this package

| File | Purpose |
|------|---------|
| `mtaa-security-wallet-migration.sql` | Production SQL for all missing security & wallet tables |
| `mtaa-type-consolidator.py` | Scans repo, finds duplicate types, optionally fixes them |
| `mtaa-temp-cleanup.py` | Removes fix scripts, .new files, replacements/, etc. |
| `IMPLEMENTATION_ROADMAP.md` | Step-by-step execution plan |

---

## PHASE 1 — DATABASE (Do FIRST)
**Time: 15 minutes | Owner: Any engineer with Supabase access**

1. Open Supabase Dashboard → SQL Editor
2. Create a New Query
3. Paste the entire contents of `mtaa-security-wallet-migration.sql`
4. Click **Run**
5. Verify the output table shows all 9 tables with `row_count = 0` (empty but created)

**If any table already exists**, the SQL uses `IF NOT EXISTS` and will skip safely.

---

## PHASE 2 — TYPE CONSOLIDATION (Do BEFORE next commit)
**Time: 1 hour | Owner: Engineer B**

```bash
cd ~/MTAA_OS_V10

# Step 1: Audit (dry run — no files changed)
python3 mtaa-type-consolidator.py

# Review type-consolidation-report.json
# Focus on HIGH severity duplicates first

# Step 2: Apply fixes
python3 mtaa-type-consolidator.py --fix

# Step 3: Verify no new TS errors
npx tsc --noEmit 2>&1 | tail -10

# Step 4: Commit
git add -A
git commit -m "consolidate: deduplicate types across domains"
```

---

## PHASE 3 — TEMP CLEANUP (Do AFTER type consolidation)
**Time: 10 minutes | Owner: Engineer A**

```bash
cd ~/MTAA_OS_V10

# Step 1: Dry run
python3 mtaa-temp-cleanup.py --dry-run

# Step 2: Review the list
# Step 3: Live cleanup
python3 mtaa-temp-cleanup.py
# Type 'yes' when prompted

# Step 4: Commit
git add -A
git commit -m "cleanup: remove temporary fix scripts and debris"
```

---

## PHASE 4 — TYPESCRIPT ERROR PERMANENT FIX
**Time: 1.5 hours | Owner: Engineer A**

The previous commit used `as any` casts to bypass errors. Replace these with proper fixes:

### 4A. AuthState — add `profile` property properly
File: `lib/auth/store/auth.store.ts`
- Add `profile: UserProfile | null` to the AuthState interface
- Add `refreshProfile: () => Promise<void>` implementation in the store
- Remove `as any` casts from all 11 consuming files

### 4B. PIN Engine — fix API signatures
File: `lib/security/pin-engine.ts`
- Verify all methods accept `(userId: string, ...)`
- Update callers in:
  - `app/(os)/settings/pin.tsx`
  - `lib/components/wallet-pin-guard.tsx`
  - `lib/security/app-lock-provider.tsx`

### 4C. Biometric Engine — complete exports
File: `lib/security/biometric-engine.ts`
- Export: `checkBiometricStatus`, `authenticateBiometric`, `setBiometricEnabled`
- Export: `hasHardwareAsync`, `isEnrolledAsync`
- Fix `LocalAuthentication` import pattern

### 4D. Streets Service — fix GenericStringError
File: `lib/services/streets-service.ts`
- Replace `as any` casts with proper type guards
- Verify `fetchAuthorProfiles` handles error responses correctly

### 4E. Wallet / Device Engine — fix protected property access
Files:
- `app/(os)/wallet/send.tsx`
- `lib/security/device-engine.ts`
- Replace `supabase.supabaseUrl` with `process.env.EXPO_PUBLIC_SUPABASE_URL`

---

## PHASE 5 — ESLINT PERMANENT FIX
**Time: 15 minutes | Owner: Engineer A**

The current `eslint.config.mjs` has an override appended. This is acceptable for launch but should be replaced with a proper config post-launch.

For now, verify it works:
```bash
npx eslint . 2>&1 | tail -5
# Expected: 0 problems
```

If errors remain, the override block needs to be the **last** element in the exported array.

---

## PHASE 6 — PRE-COMMIT GATE VERIFICATION
**Time: 10 minutes | All engineers**

```bash
cd ~/MTAA_OS_V10

# Gate 1: TypeScript
npx tsc --noEmit
# Expected: 0 errors

# Gate 2: ESLint
npx eslint . 2>&1 | tail -5
# Expected: 0 problems

# Gate 3: Type Consolidation (if your husky has this)
python3 mtaa-type-consolidator.py
# Expected: No HIGH severity duplicates

# Gate 4: Commit
git add -A
git commit -m "checkpoint: deployment readiness — sql, types, cleanup"
# Expected: Husky passes, commit succeeds WITHOUT --no-verify
```

---

## PHASE 7 — RUNTIME VERIFICATION
**Time: 1 hour | Owner: Engineer A + B**

Test on physical device or emulator:

| # | Test | Expected |
|---|------|----------|
| 1 | Fresh app install → boot | OS shell loads |
| 2 | Sign up → email verification | Email sent, account active |
| 3 | PIN setup | PIN stored in `user_pin_hashes` |
| 4 | Biometric enrollment | Device trust recorded |
| 5 | Lock → PIN unlock | Unlocks successfully |
| 6 | Lock → Biometric unlock | Unlocks successfully |
| 7 | Logout → Login | Session restored |
| 8 | Streets feed | Posts load, video plays |
| 9 | Profile | Avatar + stats visible |
| 10 | Wallet | Balance from DB shows |
| 11 | QR scan → payment intent | Intent created |
| 12 | M-Pesa deposit | Callback processed, balance updates |

---

## PHASE 8 — DEPLOYMENT
**Time: 30 minutes | Owner: Engineer C**

### 8A. Verify Edge Function Secrets
In Supabase Dashboard → Edge Functions → Secrets, confirm:
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_PASSKEY`
- `FULIZA_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 8B. Build Production
```bash
# Clean build
npx expo prebuild --clean

# iOS
npx eas build --platform ios --profile production

# Android
npx eas build --platform android --profile production

# Web (Vercel)
npx expo export --platform web
# Deploy dist/ folder to Vercel
```

---

## SUCCESS CRITERIA

Before calling MTAA "deployment-ready", ALL of these must pass:

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx eslint .` → 0 errors
- [ ] `git commit` → passes husky without `--no-verify`
- [ ] Supabase `user_pin_hashes` table returns 200 via REST
- [ ] Supabase `wallet_spending_limits` table returns 200 via REST
- [ ] App boots from clean install
- [ ] Auth flow (signup → verify → PIN → biometric) works end-to-end
- [ ] Wallet balance displays correctly
- [ ] QR payment flow completes with PIN confirmation
- [ ] EAS build succeeds for both iOS and Android
- [ ] No temporary files in repository root
- [ ] No duplicate type definitions (HIGH severity)

---

## CRITICAL RULES

1. **Do NOT remove `@ts-nocheck` from the 470+ ASIS/health/education files** — these are intentional tech-debt suppressions, not stubs.
2. **Do NOT weaken RLS policies** to fix app errors.
3. **Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` in client code** — it must stay in Edge Function secrets only.
4. **Do NOT skip the database migration** — PIN/biometric/wallet will crash at runtime without these tables.
5. **Do NOT use `--no-verify` on the final commit** — the pre-commit gate must pass cleanly.

---

## SUPPORT

If any phase fails, capture the exact error output and paste it for the next fix iteration.
