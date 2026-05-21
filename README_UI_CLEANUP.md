# MTAA UI Cleanup Batch 1

## Contents
- 7 UI primitives (components/ui/)
- 4 stabilized screens (home, launcher, notifications, system-status)

## Install
cd ~/MTAA_OS_V10
unzip -o mtaa_ui_cleanup_batch1.zip
rm -rf $TMPDIR/metro-* $TMPDIR/haste-map-* .expo/web/cache
npx expo start --clear
