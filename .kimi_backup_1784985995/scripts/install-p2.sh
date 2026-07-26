#!/bin/bash
# P2 Wallet Integration Install Script
# Run from ~/MTAA_OS_V10

echo "=== P2 Wallet Integration Install ==="

cd ~/Downloads && unzip -o mtaa_p2_wallet_integration.zip -d ~/MTAA_OS_V10/

cd ~/MTAA_OS_V10

# Backup existing wallet index
cp app/\(os\)/wallet/index.tsx app/\(os\)/wallet/index.tsx.backup 2>/dev/null

# Install new files
echo "Installing updated wallet index..."
echo "Installing treasury service..."
echo "Installing escrow service..."
echo "Installing tax service..."
echo "Installing treasury hub..."
echo "Installing escrow hub..."
echo "Installing tax hub..."

# Add barrel exports (check if already present)
if ! grep -q "treasury-service" lib/services/index.ts; then
  echo "export * from './treasury-service';" >> lib/services/index.ts
fi
if ! grep -q "escrow-service" lib/services/index.ts; then
  echo "export * from './escrow-service';" >> lib/services/index.ts
fi
if ! grep -q "tax-service" lib/services/index.ts; then
  echo "export * from './tax-service';" >> lib/services/index.ts
fi

echo ""
echo "=== Verifying Installation ==="
ls -la lib/services/treasury-service.ts
ls -la lib/services/escrow-service.ts
ls -la lib/services/tax-service.ts
ls -la "app/(os)/wallet/treasury-hub.tsx"
ls -la "app/(os)/wallet/escrow-hub.tsx"
ls -la "app/(os)/wallet/tax-hub.tsx"
ls -la "app/(os)/wallet/index.tsx"

echo ""
echo "=== P2 Installation Complete ==="
echo "Next: Test Treasury Hub, Escrow Hub, and Tax Hub from Wallet screen."
