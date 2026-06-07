#!/bin/bash
# MTAA OS Route Files Installer
# Run from ~/MTAA_OS_V10

echo "=== MTAA OS Route Installer ==="
echo ""

# Check we're in the right directory
if [ ! -d "app" ]; then
    echo "ERROR: Run this from ~/MTAA_OS_V10"
    exit 1
fi

# Create directories
echo "Creating directories..."
mkdir -p app/\(civic\)/police
mkdir -p app/\(civic\)/courts
mkdir -p app/\(civic\)/prisons
mkdir -p app/\(civic\)/revenue
mkdir -p app/\(work\)
mkdir -p app/\(education\)
mkdir -p app/\(local\)/streets
mkdir -p app/\(local\)/hookup
mkdir -p app/\(communication\)/messages
mkdir -p app/\(communication\)/phone
mkdir -p app/\(media\)/gallery
mkdir -p app/\(media\)/camera
mkdir -p app/\(productivity\)/clock
mkdir -p app/\(productivity\)/calendar
mkdir -p app/\(utility\)/calculator
mkdir -p app/\(system\)/command
mkdir -p app/\(finance\)/credit
mkdir -p app/\(finance\)/binance
mkdir -p app/\(mtruck\)

echo "Installing route files..."

# Move files from Downloads
DOWNLOADS=~/Downloads

mv "$DOWNLOADS/app_\(civic\)_police_index.tsx" app/\(civic\)/police/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(civic\)_courts_index.tsx" app/\(civic\)/courts/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(civic\)_prisons_index.tsx" app/\(civic\)/prisons/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(civic\)_revenue_index.tsx" app/\(civic\)/revenue/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(work\)_index.tsx" app/\(work\)/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(education\)_index.tsx" app/\(education\)/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(local\)_streets_index.tsx" app/\(local\)/streets/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(local\)_hookup_index.tsx" app/\(local\)/hookup/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(communication\)_messages_index.tsx" app/\(communication\)/messages/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(communication\)_phone_index.tsx" app/\(communication\)/phone/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(media\)_gallery_index.tsx" app/\(media\)/gallery/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(media\)_camera_index.tsx" app/\(media\)/camera/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(productivity\)_clock_index.tsx" app/\(productivity\)/clock/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(productivity\)_calendar_index.tsx" app/\(productivity\)/calendar/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(utility\)_calculator_index.tsx" app/\(utility\)/calculator/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(system\)_command_index.tsx" app/\(system\)/command/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(finance\)_credit_index.tsx" app/\(finance\)/credit/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(finance\)_binance_index.tsx" app/\(finance\)/binance/index.tsx 2>/dev/null
mv "$DOWNLOADS/app_\(mtruck\)_index.tsx" app/\(mtruck\)/index.tsx 2>/dev/null

echo ""
echo "=== Installation Complete ==="
echo "Restart with: npx expo start --clear"
