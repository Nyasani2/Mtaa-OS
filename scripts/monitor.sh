#!/usr/bin/env bash
# MTAA Health - Simple uptime monitor (Ctrl+C to stop)
PORT="${PORT:-8081}"
INTERVAL="${1:-30}"
echo "📈 Monitoring http://localhost:${PORT} every ${INTERVAL}s (Ctrl+C to stop)"
while true; do
  CODE=$(curl -s -o /dev/null -w "%{http_code} %{time_total}s" "http://localhost:${PORT}" || echo "DOWN")
  echo "$(date '+%H:%M:%S')  $CODE"
  sleep "$INTERVAL"
done
