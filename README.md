# MTAA_OS_V10 Cleanup & TypeScript Fix Package

## WHAT THIS PACKAGE CONTAINS

### 1. mtaa_cleanup_script.sh
Deletes 261+ dead/orphan/duplicate files from your project.

### 2. tsconfig.json
Updated TypeScript config with proper excludes for:
- supabase/functions (Deno runtime — not frontend TS)
- android, ios (native build dirs)
- docs, infra, tools, stubs (non-code)
- backend, schema, sql, migrations (SQL files)
- modules_disabled (dead code)
- public, assets (static files)

## WHY SUPABASE FUNCTIONS HAVE "ERRORS"

The `supabase/functions/` directory contains **Deno edge functions** — they run on Supabase's server, NOT in your React Native app. They use:
- `Deno.serve()` — Deno runtime API
- `https://esm.sh/...` imports — URL imports
- `https://deno.land/std/...` — Deno standard library

Your frontend TypeScript compiler (`tsc`) doesn't understand Deno. These are **false positives** — not real errors. They should be excluded from frontend compilation.

## WHY DELETE FILES INSTEAD OF EXCLUDE?

| Approach | Problem |
|----------|---------|
| Exclude in tsconfig | Files still clutter project, slow git, confuse developers |
| Delete dead files | Clean project, faster builds, no confusion |

The 261 files being deleted are ALL dead code — backups, old ZIPS, audit scripts, duplicate flat files, orphan SQL/TXT. None are needed for production.

## FILES BEING DELETED (by category)

### Backup Files (14)
All `.backup.*` and `.bak.*` files in lib/services/, lib/stores/, lib/wallet/

### ZIP Files (64)
All old fix packages: mtaa-*-fix.zip, streets-*-fix.zip, profile-*-fix.zip, ZIP_R_*.zip

### Audit Scripts (14)
All Python/TS audit scripts and their JSON outputs: audit_*.py, audit-*.ts, audit-*.json

### Fix/Install/Dump Scripts (41)
All shell scripts used for previous fixes: fix_*.sh, install*.sh, cleanup*.sh, dump*.sh

### Orphan SQL at Root (40)
All .sql files sitting at project root — these belong in backend/sql/ or supabase/migrations/

### Orphan TXT (16)
All .txt files at root — notes, dumps, logs

### Duplicate Flat Files (27)
Files like `lib_auth_identity.ts`, `hooks_useAuth.ts` — these are copies of real files in lib/ and hooks/ directories. They were created during batch fixes and are now duplicates.

### Orphan TS Files (7)
`constants_theme.ts`, `streets-service.ts`, `types_appstore.ts`, etc. — copies of real files.

### Garbage Files (17)
`0`, `0.1,`, `build.log`, `metro.log`, `tsconfig.tsbuildinfo`, etc.

### Orphan MD Files (21)
All README_*.md, *_GUIDE.md, *_README.md — documentation artifacts from previous sessions.

## ROOT-LEVEL SCREENS (NOT DELETED — NEED REORGANIZATION)

These 32 .tsx files at root are REAL CODE but misplaced:
- achievements.tsx, analytics.tsx, business.tsx, business_profile.tsx, etc.
- They should be moved into `app/(os)/` or `domains/` structure
- DO NOT DELETE — they contain active screen code

## HOW TO APPLY

### Step 1: Run Cleanup Script
```bash
cd ~/MTAA_OS_V10
bash ~/Downloads/mtaa_cleanup_script.sh
```

### Step 2: Replace tsconfig.json
```bash
cp ~/Downloads/tsconfig.json ~/MTAA_OS_V10/tsconfig.json
```

### Step 3: Clear TypeScript Cache
```bash
cd ~/MTAA_OS_V10
rm -rf node_modules/.expo
rm -f tsconfig.tsbuildinfo
```

### Step 4: Check Remaining Errors
```bash
npx tsc --noEmit
```

## EXPECTED RESULT

| Before | After Cleanup + tsconfig |
|--------|---------------------------|
| ~2,048 errors | ~100-200 errors (real frontend issues) |
| 4,025 files | ~3,700 files |
| Cluttered root | Clean root |

## NEXT STEPS AFTER CLEANUP

1. Fix remaining TypeScript errors in actual frontend code
2. Move root-level screens into proper app/ structure
3. Fix direct supabase calls in screen files (architecture violation)
4. Add proper service layer for all data operations
