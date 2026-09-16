#!/usr/bin/env bash
# MTAA Health - Deploy web build (Expo export) -> ready for any static host / VPS
set -u
echo "🚀 Deploy build"
if [ -f package.json ] && grep -q '"web"' package.json; then
  npm run web -- --port ${PORT:-8081} &
  echo "✅ dev web started on :${PORT:-8081}"
elif [ -f package.json ]; then
  npx expo export --platform web && echo "✅ static build in dist/ (serve dist/ with nginx/vercel)"
else
  echo "⚠️  package.json not found - run from project root"
fi
