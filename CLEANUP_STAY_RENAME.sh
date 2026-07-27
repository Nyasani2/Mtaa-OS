#!/bin/bash
# MTAA STAY RENAME CLEANUP SCRIPT
# Run this AFTER extracting all 4 Stay ZIPs

cd ~/MTAA_OS_V10

echo "=== MTAA Stay Rename Cleanup ==="

# Remove old Property app routes (keep until you confirm Stay works)
echo "Removing old app/(os)/property/..."
rm -rf "app/(os)/property"

# Remove old Property domain
echo "Removing old domains/property/..."
rm -rf "domains/property"

# Remove old manifests
echo "Removing old property manifests..."
rm -f "manifests/property_manifest.ts"
rm -f "lib/modules/property/manifest.ts"

echo "Cleanup complete."
echo "Next: Update your AppStore registry to point to 'stay' instead of 'property'."
echo "Then: npx expo start --clear"
