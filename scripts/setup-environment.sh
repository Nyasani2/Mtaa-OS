#!/usr/bin/env bash
# MTAA OS V10 - Health Module Environment Setup (SAFE: never kills your terminal)
# Path: scripts/setup-environment.sh

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; }

echo "🏥 MTAA Health - Environment Setup"
echo "----------------------------------"

# Tool checks - WARN only, never exit (exits are what closed your terminal)
command -v node >/dev/null 2>&1 && info "node $(node -v)" || fail "node not found - install Node 18+"
command -v npm  >/dev/null 2>&1 && info "npm $(npm -v)"  || fail "npm not found"
command -v pnpm >/dev/null 2>&1 && info "pnpm $(pnpm -v)" || warn "pnpm not found - using npm instead"
command -v supabase >/dev/null 2>&1 && info "supabase CLI ok" || warn "supabase CLI not found (optional - used for migrations/types)"

# .env ( Expo / Supabase flavour - matches MTAA OS V10 )
if [ ! -f .env ]; then
  cat > .env << 'EOF'
# ---- MTAA OS V10 - Health Module ----
NODE_ENV=development
EXPO_PUBLIC_APP_URL=http://localhost:8081
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
PORT=8081
EOF
  info ".env created -> fill in your Supabase credentials"
else
  info ".env already exists - left untouched"
fi

# Dependencies
if [ -f package.json ]; then
  warn "Skipping auto-install (run: npm install  or  pnpm install  yourself)"
else
  fail "package.json not found - run this script from the project ROOT (~/MTAA_OS_V10)"
fi

mkdir -p uploads/patients uploads/records uploads/imaging logs backups
info "Directories ready (uploads/ logs/ backups/)"
echo ""
info "Next:  1) fill .env   2) bash scripts/run-migrations.sh   3) bash scripts/health-check.sh"
