#!/bin/bash
# Remove conflicting flat route files — keep only nested index.tsx versions
echo "Removing conflicting flat route files..."

rm -f app/\(os\)/profile/family.tsx
rm -f app/\(os\)/profile/professional.tsx
rm -f app/\(os\)/profile/business.tsx
rm -f app/\(os\)/profile/qr.tsx

echo "Flat files removed. Only nested routes remain:"
echo "  - profile/family/index.tsx"
echo "  - profile/professional/index.tsx"
echo "  - profile/business/index.tsx"
echo "  - profile/qr/index.tsx"
