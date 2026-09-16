#!/usr/bin/env bash
# MTAA Health - Environment & connectivity check (read-only, always safe)
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}PASS${NC} $1"; }
bad()  { echo -e "${RED}FAIL${NC} $1"; }
source .env 2>/dev/null || true

echo "🩺 MTAA Health Check"
echo "--------------------"
[ -f package.json ] && ok "package.json found" || bad "run from project root"
[ -f .env ] && ok ".env found" || bad ".env missing (run setup-environment.sh)"

command -v node >/dev/null && ok "node $(node -v)" || bad "node missing"
PORT="${PORT:-8081}"
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}" | grep -qE "200|301|302"; then
  ok "app responding on :${PORT}"
else
  bad "no app on :${PORT} (start with: npm run web)"
fi
if [ -n "${EXPO_PUBLIC_SUPABASE_URL:-}" ]; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health")
  [ "$CODE" = "200" ] && ok "Supabase reachable" || bad "Supabase unreachable (HTTP $CODE)"
else
  bad "EXPO_PUBLIC_SUPABASE_URL not set"
fi
echo "-------------------- done"
