#!/bin/bash
# Fix .expo directory structure after rm -rf .expo
mkdir -p ~/MTAA_OS_V10/.expo/types
touch ~/MTAA_OS_V10/.expo/types/router.d.ts
echo "// Placeholder — Expo Router will regenerate this" > ~/MTAA_OS_V10/.expo/types/router.d.ts
