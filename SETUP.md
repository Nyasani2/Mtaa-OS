# MTAA OS v1 — Setup Guide

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)
- Your Supabase project credentials

## Step 1: Clone & Install

```bash
git clone <your-repo> MTAA_OS_V1
cd MTAA_OS_V1
npm install
```

## Step 2: Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

> **Note:** Use `EXPO_PUBLIC_` prefix so variables are available in the app bundle.

## Step 3: Generate Database Types

```bash
npx supabase login
npx supabase gen types typescript   --project-id your-project-ref   --schema public > lib/types/database.ts
```

## Step 4: Start Development

```bash
npx expo start
```

Press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web

## Step 5: Configure Supabase Edge Functions

Your app calls these Edge Functions for write operations. Create them in Supabase:

```sql
-- Example: send-money function
-- Located at: supabase/functions/send-money/index.ts
```

Required Edge Functions:
| Function | Purpose |
|----------|---------|
| `send-money` | Wallet transfer between users |
| `install-app` | Install app from App Store |
| `resolve-fraud-alert` | Mark fraud alert as resolved |
| `cast-vote` | Submit election vote |

## Project Structure Quick Reference

```
app/
  (auth)/          ← Login, Register, Verify
  (os)/            ← Launcher, App Store, Settings
  (wallet)/        ← Dashboard, Send, Receive, TX, Escrow
  (civic)/         ← Identity, Tax, Payroll, Audit, Voting
  (command)/       ← Analytics, Users, TX Monitor, Fraud

lib/
  api/             ← API hooks (TanStack Query)
  stores/          ← Zustand state
  hooks/           ← Custom hooks
  utils/           ← Formatters
  types/           ← Generated DB types
  supabase.ts      ← Client initialization
```

## CIVIC Layer Rules

1. **NEVER** write directly to civic tables from frontend
2. **ALWAYS** call Edge Functions for write operations
3. **READ-ONLY** views for Tax, Payroll, Audit dashboards
4. Core system logic lives in Supabase — frontend is interface only

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module '@/*'` | Check `tsconfig.json` paths and `babel.config.js` aliases |
| Supabase auth not persisting | Ensure `AsyncStorage` is linked properly |
| Expo Router not working | Verify `main: "expo-router/entry"` in package.json |

## Next Steps

1. Wire your actual Supabase tables to the API hooks in `lib/api/`
2. Replace placeholder table names with your actual schema names
3. Add Edge Functions for all write operations
4. Implement role-based access for Command Centre routes
5. Add push notifications with Expo Notifications
