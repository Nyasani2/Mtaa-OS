#!/bin/bash
cd ~/MTAA_OS_V10

echo "=== Files in app/(os)/streets ==="
find "app/(os)/streets" -type f -name "*.tsx" -exec ls -la {} +

echo ""
echo "=== _layout.tsx ==="
cat "app/(os)/streets/_layout.tsx" 2>/dev/null || echo "No _layout.tsx"

echo ""
echo "=== Searching for New Post ==="
grep -r "New Post" "app/(os)/" --include="*.tsx" -l 2>/dev/null || echo "Not found"

echo ""
echo "=== Searching for What's happening ==="
grep -r "What's happening" "app/(os)/" --include="*.tsx" -l 2>/dev/null || echo "Not found"

echo ""
echo "=== Searching for Whats happening (no apostrophe) ==="
grep -r "Whats happening" "app/(os)/" --include="*.tsx" -l 2>/dev/null || echo "Not found"

echo ""
echo "=== All .tsx files in app/(os)/streets ==="
find "app/(os)/streets" -type f -name "*.tsx"
