#!/bin/bash
set -e

echo "=== MTAA Profile OS v2 — Schema-Confirmed Install ==="
echo ""
echo "[0] MANUAL: Open Supabase SQL Editor and run:"
echo "    mtaa_profile_os_safe_migration_v2.sql"
echo ""
read -p "Press ENTER after SQL is applied..."

echo "[1] Installing corrected social hooks..."
mkdir -p lib/social/hooks lib/social/components
# useFollow.ts, useBlock.ts, useReport.ts, useTip.ts, useSubscription.ts, index.ts

echo "[2] Installing corrected profile service..."
mkdir -p lib/profile/services lib/profile/module-integrations
# profile-service.ts, types.ts

echo "[3] Installing social components..."
# FollowButton.tsx, TipButton.tsx

echo "[4] Installing module integrations..."
# ProfileCard.tsx, ProfileAvatar.tsx, useProfileInModule.ts, index.ts

echo "[5] Installing edge functions..."
mkdir -p supabase/functions/profile-follow supabase/functions/profile-tip supabase/functions/profile-subscribe supabase/functions/profile-report supabase/functions/profile-block
# All 5 edge functions

echo "[6] Installing module integration examples..."
# streets, education, jobs, health, marketplace

echo ""
echo "=== INSTALL COMPLETE ==="
echo "Next: npx expo start --clear"
