#!/bin/bash
# MTAA Shop Route Cleanup
# Run this AFTER extracting the shop_part1 and shop_part2 ZIPs

cd ~/MTAA_OS_V10

echo "=== Removing old shop stub ==="
if [ -f "app/(commerce)/shop.tsx" ]; then
    rm app/\(commerce\)/shop.tsx
    echo "✅ Removed app/(commerce)/shop.tsx"
else
    echo "⚠️ app/(commerce)/shop.tsx not found (already removed?)"
fi

echo ""
echo "=== Verifying new route structure ==="
find app/\(commerce\)/shop -type f | sort

echo ""
echo "=== Verifying domain component ==="
ls domains/shop/components/

echo ""
echo "=== Done ==="
echo "Next: Update unified-registry.ts entry_route from '/shop' to '/(commerce)/shop'"
