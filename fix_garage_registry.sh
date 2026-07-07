#!/bin/bash
cd ~/MTAA_OS_V10

echo "=== Fix 1: Remove 'domain' from garage manifests ==="
sed -i "/domain: 'garage',/d" lib/mtaa/appstore/apps/garage/manifest.ts
sed -i "/domain: 'garage',/d" lib/modules/garage/manifest.ts

echo "=== Fix 2: Fix apps/registry.ts — move import before export ==="
# Remove the bad import/push at bottom
sed -i '/\/\/ Garage OS/,/appRegistry.push(garageManifest);/d' lib/mtaa/appstore/apps/registry.ts

# Rebuild the file with import at top
cat > /tmp/registry_fixed.ts << 'EOF'
import { AppManifest } from '@/types/module.types';

// Garage OS
import { garageManifest } from './garage/manifest';

export const appRegistry: AppManifest[] = [garageManifest];
EOF

cp /tmp/registry_fixed.ts lib/mtaa/appstore/apps/registry.ts

echo "=== Fix 3: Fix registry.ts (Map) — move import to top ==="
# Remove the bad import/registration at bottom
sed -i '/\/\/ Garage OS registration/,/registerAppStoreApp(garageManifest);/d' lib/mtaa/appstore/registry.ts

# Add import at top of file
sed -i "1i import { garageManifest } from './apps/garage/manifest';" lib/mtaa/appstore/registry.ts

# Add registration after the registerAppStoreApp function definition
# Find the line with "appRegistry.set(manifest.id, manifest);" and add after the closing brace
sed -i '/^}$/a\n// Register Garage OS
registerAppStoreApp(garageManifest);' lib/mtaa/appstore/registry.ts

echo "=== TypeScript check ==="
npx tsc --noEmit 2>&1 | head -10

echo "=== Done ==="
