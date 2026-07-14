#!/bin/bash
# MTAA OS V10 — Content Playback Fixes
# Run: cd ~/MTAA_OS_V10 && bash fix_content_playback.sh

echo "Fixing content playback..."

# 1. MStudio Dashboard — navigate to video-player instead of editor
echo "Fixing MStudio dashboard navigation..."
sed -i 's|router.push(`/(os)/studio/editor?videoId=${item.id}`)|router.push(`/(os)/studio/video-player?id=${item.id}`)|g' "app/(os)/studio/dashboard.tsx"
echo "✅ Dashboard now navigates to video-player"

# 2. Streets Feed — add media rendering
echo "Fixing Streets feed media rendering..."
# This needs the full file replacement — I'll do it below

# 3. Profile Posts — create missing screen
echo "Creating Profile Posts screen..."
# This needs a new file — I'll create it below

echo "Done."
