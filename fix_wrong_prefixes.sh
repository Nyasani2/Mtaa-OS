#!/bin/bash
# MTAA OS V10 Route Fix Script
# Run from ~/MTAA_OS_V10
# This fixes WRONG PREFIX navigation targets
# For MISSING ROUTES, copy files from new_routes/ to app/

echo "Fixing wrong-prefix navigation targets..."

# Method 1: sed (faster, simpler)
sed -i 's|/(auth)/login|/auth/login|g' app/(education)/register/parent.tsx
sed -i 's|/(auth)/login|/auth/login|g' app/(education)/register/teacher.tsx
sed -i 's|/(auth)/login|/auth/login|g' app/(education)/register/school.tsx
sed -i 's|/(auth)/login|/auth/login|g' app/(education)/register/student.tsx
sed -i 's|/(auth)/login|/auth/login|g' app/(os)/asis/chat.tsx
sed -i 's|/(auth)/set-pin|/auth/set-pin|g' app/(os)/settings/security-center.tsx

echo "Done fixing wrong prefixes!"
echo ""
echo "Next steps:"
echo "1. Copy new route files: cp -r new_routes/app/* app/"
echo "2. Run: npx expo start --clear"
echo "3. Test navigation across all modules"
