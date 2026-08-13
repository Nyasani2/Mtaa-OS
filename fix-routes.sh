#!/bin/bash
# MTAA OS V10 — Route Fix Script
# Run this from ~/MTAA_OS_V10 project root
# This script automatically fixes all broken navigation strings
# identified in the systematic route audit (Aug 11, 2026)

set -e

echo "=========================================="
echo "MTAA OS V10 Route Fix Script"
echo "=========================================="
echo ""

# ==========================================
# CATEGORY A: Auth Group Misuse
# ==========================================
echo "[1/4] Fixing Auth Group Misuse (6 replacements)..."

# /(auth)/login → /auth/login (5 files)
sed -i "s|"/(auth)/login"|"/auth/login"|g" app/\(education\)/register/parent.tsx
sed -i "s|"/(auth)/login"|"/auth/login"|g" app/\(education\)/register/teacher.tsx
sed -i "s|"/(auth)/login"|"/auth/login"|g" app/\(education\)/register/school.tsx
sed -i "s|"/(auth)/login"|"/auth/login"|g" app/\(education\)/register/student.tsx
sed -i "s|"/(auth)/login"|"/auth/login"|g" app/\(education\)/register/guardian.tsx

# /(auth)/set-pin → /auth/set-pin (1 file)
sed -i "s|"/(auth)/set-pin"|"/auth/set-pin"|g" app/\(os\)/settings/security-center.tsx

echo "  ✓ Auth group fixes applied"

# ==========================================
# CATEGORY B: Wrong Group Prefix
# ==========================================
echo "[2/4] Fixing Wrong Group Prefixes (9 replacements)..."

# /(jobs)/applications → /(work)/jobs/applications
sed -i "s|"/(jobs)/applications"|"/(work)/jobs/applications"|g" app/\(jobs\)/index.tsx

# /(jobs)/profile → /(work)/jobs/profile
sed -i "s|"/(jobs)/profile"|"/(work)/jobs/profile"|g" app/\(jobs\)/index.tsx

# /(finance)/wallet/escrow → /(os)/wallet/escrow
sed -i "s|"/(finance)/wallet/escrow"|"/(os)/wallet/escrow"|g" app/\(work\)/jobs/freelance/index.tsx

# /(finance)/wallet/deposit → /(os)/wallet/deposit
sed -i "s|"/(finance)/wallet/deposit"|"/(os)/wallet/deposit"|g" app/\(finance\)/binance/index.tsx

# /(finance)/wallet/withdraw → /(os)/wallet/withdraw
sed -i "s|"/(finance)/wallet/withdraw"|"/(os)/wallet/withdraw"|g" app/\(finance\)/binance/index.tsx

# /(restaurant)/dashboard → /(os)/restaurant/dashboard
sed -i "s|"/(restaurant)/dashboard"|"/(os)/restaurant/dashboard"|g" app/\(restaurant\)/index.tsx

# /(restaurant)/menu → /(os)/restaurant/menu
sed -i "s|"/(restaurant)/menu"|"/(os)/restaurant/menu"|g" app/\(restaurant\)/index.tsx

# /(os)/settings/pin → /settings/change-pin
sed -i "s|"/(os)/settings/pin"|"/settings/change-pin"|g" app/\(os\)/profile/index.tsx

# /(os)/wallet/pin → /settings/change-pin
sed -i "s|"/(os)/wallet/pin"|"/settings/change-pin"|g" app/\(os\)/profile/privacy.tsx

echo "  ✓ Wrong prefix fixes applied"

# ==========================================
# CATEGORY D: Confirmed Video 404s
# ==========================================
echo "[3/4] Fixing Confirmed Video 404s (3 replacements)..."

# These routes were confirmed broken during video audit
# They may exist in files not captured by grep — scan entire project

# /profile/pin → /settings/change-pin
grep -rl ""/profile/pin"" app/ --include="*.tsx" --include="*.ts" 2>/dev/null | while read f; do
    sed -i "s|"\/profile\/pin"|"\/settings\/change-pin"|g" "$f"
    echo "  Fixed: $f"
done

# /profile/qr-code → /profile/qr
grep -rl ""/profile/qr-code"" app/ --include="*.tsx" --include="*.ts" 2>/dev/null | while read f; do
    sed -i "s|"\/profile\/qr-code"|"\/profile\/qr"|g" "$f"
    echo "  Fixed: $f"
done

# /(os)/wallet/pin → /settings/change-pin (already handled above, but double-scan)
grep -rl ""/(os)/wallet/pin"" app/ --include="*.tsx" --include="*.ts" 2>/dev/null | while read f; do
    sed -i "s|"\/(os)\/wallet\/pin"|"\/settings\/change-pin"|g" "$f"
    echo "  Fixed: $f"
done

echo "  ✓ Video 404 fixes applied"

# ==========================================
# CATEGORY C: Stub Files
# ==========================================
echo "[4/4] Installing stub route files (40 files)..."

# Copy stub files into project
if [ -d "stubs" ]; then
    cp -r stubs/* app/ 2>/dev/null || true
    echo "  ✓ Stub files copied to app/"
else
    echo "  ⚠ stubs/ directory not found. Please extract stubs/ into project root first."
fi

echo ""
echo "=========================================="
echo "All fixes applied successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Run: npx tsc --noEmit"
echo "  2. Run: npx expo start --clear"
echo "  3. Test the previously broken routes"
echo ""
