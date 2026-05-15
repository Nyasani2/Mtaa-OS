#!/bin/bash
# Fix Expo Router + prefix violations

cd ~/MTAA_OS_V10

# Remove the invalid +layout.tsx from tribes-ui (it will be replaced by layout.tsx)
if [ -f "apps/tribes-ui/+layout.tsx" ]; then
    rm apps/tribes-ui/+layout.tsx
    echo "Removed invalid apps/tribes-ui/+layout.tsx"
fi

# Check for any other invalid + prefixed files in non-root directories
find apps -name "+layout.tsx" -type f | while read file; do
    echo "WARNING: Found invalid +layout.tsx at: $file"
    echo "Rename to layout.tsx or remove"
done

# Root app +layout.tsx and +not-found.tsx are valid - do not touch them
echo "Root +layout.tsx and +not-found.tsx are valid - preserved"
