#!/bin/bash
# MTAA OS V10 — Comprehensive Route Conflict Cleanup
# Finds and deletes ALL flat .tsx files that conflict with nested index.tsx files

echo "🔍 Scanning for route conflicts..."

# Find all directories that contain both a .tsx file AND an index.tsx subdirectory
find app -type f -name "*.tsx" | while read -r file; do
  # Get the directory of this file
  dir=$(dirname "$file")
  # Get the basename without extension
  base=$(basename "$file" .tsx)

  # Check if there's a subdirectory with the same name as the file (minus .tsx)
  # AND that subdirectory contains an index.tsx
  if [ -d "$dir/$base" ] && [ -f "$dir/$base/index.tsx" ]; then
    echo "⚠️  CONFLICT: $file conflicts with $dir/$base/index.tsx"
    echo "   → Deleting: $file"
    rm -f "$file"
  fi
done

echo ""
echo "✅ Route conflict cleanup complete."
echo ""

# Also find any remaining files that import missing deps and warn
echo "🔍 Checking for missing dependency imports..."

grep -r "from 'expo-clipboard'" app/ --include="*.tsx" -l 2>/dev/null | while read f; do
  echo "⚠️  $f imports expo-clipboard"
done

grep -r "from '@react-native-community/datetimepicker'" app/ --include="*.tsx" -l 2>/dev/null | while read f; do
  echo "⚠️  $f imports @react-native-community/datetimepicker"
done

grep -r "from 'react-native-qrcode-svg'" app/ --include="*.tsx" -l 2>/dev/null | while read f; do
  echo "⚠️  $f imports react-native-qrcode-svg"
done

grep -r "from 'expo-sharing'" app/ --include="*.tsx" -l 2>/dev/null | while read f; do
  echo "⚠️  $f imports expo-sharing"
done

echo ""
echo "📦 Installing missing dependencies..."
npx expo install expo-clipboard @react-native-community/datetimepicker react-native-qrcode-svg expo-sharing

echo ""
echo "🚀 Restarting with cleared cache..."
npx expo start --clear
