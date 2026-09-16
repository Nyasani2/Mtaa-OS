#!/usr/bin/env bash
# MTAA Health Scripts - Guided installer (safe order, warn-only)
echo "🏥 MTAA Health Scripts - Installer"
echo "=================================="
[ -f package.json ] || { echo "⚠️  Run from your project root (~/MTAA_OS_V10)"; exit 0; }
bash scripts/setup-environment.sh
echo ""
echo "👉 Now:"
echo "  1. Fill in .env (Supabase URL + keys)"
echo "  2. SQL:  paste scripts/init-database.sql into Supabase SQL Editor -> Run"
echo "     (never paste into your terminal)"
echo "  3. bash scripts/health-check.sh"
echo "  4. bash scripts/test-api.sh"
