#!/bin/bash
cd ~/MTAA_OS_V10

# Install required Expo SDK packages
npx expo install expo-network expo-location expo-cellular expo-battery

echo ""
echo "=== IMPORTANT: Add these plugins to your app.json ==="
echo ""
cat << 'PLUGIN_EOF'
{
  "expo": {
    "plugins": [
      "expo-network",
      "expo-location",
      "expo-cellular",
      "expo-battery"
    ]
  }
}
PLUGIN_EOF
echo ""
echo "If you have app.config.js, add them there instead."
echo ""
echo "Then run: npx expo start --web"
