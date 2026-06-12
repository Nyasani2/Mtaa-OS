#!/bin/bash
# ASIS Package Installer

echo "Installing ASIS Package..."

cd ~/MTAA_OS_V10

# Create directories
mkdir -p "app/(os)/asis"
mkdir -p "app/(os)/command"

# Copy files
cp ~/Downloads/asis_package/asis-chat-app.tsx "app/(os)/asis/index.tsx"
cp ~/Downloads/asis_package/asis-simulator.tsx "app/(os)/command/asis-simulator.tsx"

echo "✅ ASIS Package installed."
echo ""
echo "Routes:"
echo '  - app/(os)/asis/index.tsx        → ASIS Chat App'
echo '  - app/(os)/command/asis-simulator.tsx → ASIS Simulator'
echo ""
echo "Next: npx expo start --clear"
