#!/usr/bin/env bash
# MTAA Health - Safe cleanup of caches/build artifacts (NEVER touches source or .env)
echo "🧹 Cleaning caches..."
rm -rf .expo node_modules/.cache dist web-build 2>/dev/null
command -v watchman >/dev/null && watchman watch-del-all 2>/dev/null
npm cache verify >/dev/null 2>&1
echo "✅ Clean. Reinstall with: npm install"
