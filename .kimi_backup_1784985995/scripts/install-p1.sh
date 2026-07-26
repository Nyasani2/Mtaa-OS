#!/bin/bash
cd ~/MTAA_OS_V10

# Extract P1 files
unzip -o ~/Downloads/mtaa_p1_revenue_systems.zip -d ~/MTAA_OS_V10/

# Add barrel exports to lib/services/index.ts
echo "export * from './treasury-service';" >> lib/services/index.ts
echo "export * from './escrow-service';" >> lib/services/index.ts
echo "export * from './tax-service';" >> lib/services/index.ts

# Verify files exist
echo "=== P1 Files Installed ==="
ls -la lib/services/treasury-service.ts
ls -la lib/services/escrow-service.ts
ls -la lib/services/tax-service.ts
ls -la app/\(os\)/wallet/treasury-hub.tsx
ls -la app/\(os\)/wallet/escrow-hub.tsx
ls -la app/\(os\)/wallet/tax-hub.tsx
ls -la app/\(os\)/wallet/qr-action.tsx

echo "=== P1 Revenue Systems Installed ==="
