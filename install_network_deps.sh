#!/bin/bash
cd ~/MTAA_OS_V10

# Install required Expo SDK packages
npx expo install expo-network expo-location expo-cellular expo-battery

echo "Done. Now add plugins to app.json:"
echo ''
echo '{'
echo '  "expo": {'
echo '    "plugins": ['
echo '      "expo-network",'
echo '      "expo-location",'
echo '      "expo-cellular",'
echo '      "expo-battery"'
echo '    ]'
echo '  }'
echo '}'
