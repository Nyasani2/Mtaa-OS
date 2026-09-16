#!/usr/bin/env bash
# MTAA Health - Smoke-test the running app (read-only GETs; no auth required)
PORT="${PORT:-8081}"
BASE="http://localhost:${PORT}"
pass(){ echo "✅ $1"; }; fail(){ echo "❌ $1"; }
echo "🧪 Smoke-testing $BASE"
for R in "/health" "/health/doctor" "/health/lab/queue" "/health/patient/dashboard"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$R")
  [ "$CODE" = "200" ] && pass "$R ($CODE)" || fail "$R ($CODE)"
done
echo "(200/301/302 all count as reachable for Expo routes)"
