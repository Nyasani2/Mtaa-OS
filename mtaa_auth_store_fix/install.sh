#!/bin/bash
cd ~/MTAA_OS_V10
cp mtaa_auth_store_fix/auth.store.ts lib/auth/store/auth.store.ts
echo "✅ auth.store.ts patched with timeout guard"
echo "Run: npx expo start --web --clear"
