# MTAA UI Cleanup Batch 2

## Contents
- 14 _layout.tsx files (for apps missing layouts)
- 5 stabilized single-screen apps (clock, messages, sim, recents, scheduler)

## Install
cd ~/MTAA_OS_V10
unzip -o mtaa_ui_cleanup_batch2.zip
rm -rf $TMPDIR/metro-* $TMPDIR/haste-map-* .expo/web/cache
npx expo start --clear
