#!/usr/bin/env bash
# MTAA Health - Validate .env completeness
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
ok(){ echo -e "${GREEN}OK${NC}  $1"; }; bad(){ echo -e "${RED}MISS${NC} $1"; }
[ -f .env ] || { echo "⚠️  .env not found"; exit 0; }
source .env 2>/dev/null
for K in EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY DATABASE_URL PORT; do
  V="${!K:-}"
  if [ -n "$V" ] && [[ "$V" != *"YOUR"* ]]; then ok "$K"; else bad "$K"; fi
done
