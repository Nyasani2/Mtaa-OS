#!/bin/bash
# Remove conflicting flat route files that clash with nested index.tsx routes
echo "Removing conflicting flat route files..."

# These flat files conflict with their nested folder counterparts:
# profile/family.tsx vs profile/family/index.tsx -> same route pattern
# profile/professional.tsx vs profile/professional/index.tsx -> same route pattern
# profile/business.tsx vs profile/business/index.tsx -> same route pattern
# profile/qr.tsx vs profile/qr/index.tsx -> same route pattern

rm -f "app/(os)/profile/family.tsx"
rm -f "app/(os)/profile/professional.tsx"
rm -f "app/(os)/profile/business.tsx"
rm -f "app/(os)/profile/qr.tsx"

echo "Flat route files removed."
echo "Only nested routes remain:"
echo "  profile/family/index.tsx"
echo "  profile/professional/index.tsx"
echo "  profile/business/index.tsx"
echo "  profile/qr/index.tsx"
