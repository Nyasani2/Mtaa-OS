#!/usr/bin/env bash
# MTAA Health - Regenerate Supabase TypeScript types from the LIVE schema
source .env 2>/dev/null || true
if ! command -v supabase >/dev/null 2>&1; then echo "⚠️  supabase CLI required: npm i -g supabase"; exit 0; fi
[ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" ] && { echo "⚠️  EXPO_PUBLIC_SUPABASE_URL missing in .env"; exit 0; }
mkdir - lib/types 2>/dev/null
supabase gen types typescript --project-id "$(echo $EXPO_PUBLIC_SUPABASE_URL | sed 's|https://||;s|\.supabase\.co||')" \
  > lib/types/database.types.ts \
&& echo "✅ types written: lib/types/database.types.ts"
