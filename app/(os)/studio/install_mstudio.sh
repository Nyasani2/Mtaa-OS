#!/bin/bash
# MStudio Wave 4 Install Script
# Run this from ~/MTAA_OS_V10

cd ~/MTAA_OS_V10

# Move downloaded zips if they exist
mv ~/Downloads/mstudio_wave1.zip ./ 2>/dev/null || true
mv ~/Downloads/mstudio_wave2.zip ./ 2>/dev/null || true
mv ~/Downloads/mstudio_wave3.zip ./ 2>/dev/null || true
mv ~/Downloads/mstudio_wave4.zip ./ 2>/dev/null || true

# Extract all waves to studio directory
STUDIO_DIR="app/(os)/studio"

unzip -o mstudio_wave1.zip -d "$STUDIO_DIR"
unzip -o mstudio_wave2.zip -d "$STUDIO_DIR"
unzip -o mstudio_wave3.zip -d "$STUDIO_DIR"
unzip -o mstudio_wave4.zip -d "$STUDIO_DIR"

# Rename files to match your existing route names
cd "$STUDIO_DIR"

# Only rename if the old files don't already exist (preserve your existing ones)
if [ ! -f "camera.tsx" ]; then
    mv camera-advanced.tsx camera.tsx 2>/dev/null || true
fi

if [ ! -f "editor.tsx" ]; then
    mv editor-advanced.tsx editor.tsx 2>/dev/null || true
fi

if [ ! -f "monetization.tsx" ]; then
    mv monetization-full.tsx monetization.tsx 2>/dev/null || true
fi

# Clean up zips
cd ~/MTAA_OS_V10
rm -f mstudio_wave1.zip mstudio_wave2.zip mstudio_wave3.zip mstudio_wave4.zip

echo "✅ MStudio 100% installed to app/(os)/studio/"
echo ""
echo "New screens:"
echo "  - camera.tsx (Advanced Camera)"
echo "  - editor.tsx (Editing Studio)"
echo "  - search.tsx (Universal Search)"
echo "  - music-studio.tsx (Music Studio)"
echo "  - monetization.tsx (Full Monetization)"
echo "  - revenue-sharing.tsx (Revenue Engine)"
echo "  - education-studio.tsx (Teacher-gated Education)"
echo "  - children-zone.tsx (Children's Zone)"
echo "  - community.tsx (Community Hub)"
echo "  - accessibility.tsx (Accessibility Settings)"
echo "  - copyright.tsx (Copyright & Rights)"
echo "  - safety.tsx (Safety & Moderation)"
echo "  - integrations.tsx (Integration Hub)"
echo "  - performance.tsx (Performance Settings)"
echo "  - mstudio-complete.tsx (Completion Dashboard)"
echo ""
echo "Remember to run the SQL: mstudio_viewer_tables.sql"
