#!/usr/bin/env bash
# MTAA Health - Push a notification to a webhook (Slack/Discord/Telegram/ntfy)
MSG="${1:-MTAA Health: task completed}"
URL="${NOTIFY_WEBHOOK:-}"
if [ -z "$URL" ]; then echo "⚠️  set NOTIFY_WEBHOOK in .env"; exit 0; fi
curl -s -X POST "$URL" -H 'Content-Type: application/json' \
  -d "{\"text\": \"${MSG}\"}" >/dev/null && echo "✅ notified"
