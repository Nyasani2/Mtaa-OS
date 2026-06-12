#!/bin/bash
# Patch MTAA OS Home Screen — Add ASIS + Fix User Name

cd ~/MTAA_OS_V10

# Backup
cp app/\(os\)/index.tsx app/\(os\)/index.tsx.backup.$(date +%s)

# 1. Add ASIS to DEFAULT_SYSTEM_APPS (after profile line)
sed -i '/{ id: "profile", label: "Profile"/a\  { id: "asis", label: "ASIS", icon: "Sparkles", route: "/(os)/asis", color: "#6366f1" },' app/\(os\)/index.tsx

# 2. Add Command to DEFAULT_CORE_APPS (after appstore line)
sed -i '/{ id: "appstore", label: "AppStore"/a\  { id: "command", label: "Command", icon: "Shield", route: "/(os)/command/asis-simulator", color: "#10b981" },' app/\(os\)/index.tsx

# 3. Fix user name — replace getGreeting("Warrior") with dynamic name
# First, find the line and show it
echo "Looking for getGreeting call..."
grep -n 'getGreeting' app/\(os\)/index.tsx

# Replace hardcoded "Warrior" with dynamic user name
sed -i 's/getGreeting("Warrior")/getGreeting(profile?.name || profile?.full_name || user?.email?.split("@")[0] || "Warrior")/g' app/\(os\)/index.tsx

echo "✅ Home screen patched."
echo "Check the file for any syntax errors, then run: npx expo start --clear"
