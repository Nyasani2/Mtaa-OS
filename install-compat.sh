#!/bin/bash
cd ~/MTAA_OS_V10

# Create directories if missing
mkdir -p domains/wallet/hooks
mkdir -p domains/streets/hooks
mkdir -p lib/hooks

# Install compat shims
cp ~/Downloads/useWallet-compat.ts domains/wallet/hooks/useWallet.ts
cp ~/Downloads/useWallet-streets-compat.ts domains/streets/hooks/useWallet.ts
cp ~/Downloads/useWallet-lib-compat.ts lib/hooks/useWallet.ts

echo "Compat shims installed. Restart Metro with 'r'"
