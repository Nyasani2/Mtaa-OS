#!/bin/bash
set -e

echo "=== MTAA V10 Final Fix ==="
echo ""

# 1. Extract feedService.ts
echo "[1/3] Replacing feedService.ts..."
cp domains/education/services/feedService.ts domains/education/services/feedService.ts.new
mv domains/education/services/feedService.ts.new domains/education/services/feedService.ts

# 2. Fix TransportAdminScreen.tsx using Python
echo "[2/3] Fixing TransportAdminScreen.tsx parens..."
python3 fix_transport_admin.py

# 3. Verify
echo "[3/3] Verifying..."
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit 2>&1 | head -25

echo ""
echo "=== Done ==="
echo "If errors remain, paste the output."
