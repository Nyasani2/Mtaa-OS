#!/bin/bash
# MTAA Pulse — Production Install Script (CORRECTED)
# Run from ~/MTAA_OS_V10

echo "=== MTAA Pulse Production Install ==="

mkdir -p "app/(os)/pulse/(tabs)"
mkdir -p "domains/pulse/state"
mkdir -p "domains/pulse/services"
mkdir -p "domains/pulse/hooks"
mkdir -p "domains/pulse/components"

echo "1. SQL schema: pulse_production/01_pulse_schema.sql"
echo "   Run this in Supabase SQL Editor first."

cp "pulse_production/02_pulse_types.ts" "domains/pulse/types.ts"
cp "pulse_production/03_pulse_store.ts" "domains/pulse/state/store.ts"
cp "pulse_production/04_pulse_service.ts" "domains/pulse/services/pulseService.ts"
cp "pulse_production/05_pulse_hooks.ts" "domains/pulse/hooks/usePulseHome.ts"

cp "pulse_production/screens/_layout.tsx" "app/(os)/pulse/_layout.tsx"
cp "pulse_production/screens/(tabs)/_layout.tsx" "app/(os)/pulse/(tabs)/_layout.tsx"
cp "pulse_production/screens/(tabs)/index.tsx" "app/(os)/pulse/(tabs)/index.tsx"
cp "pulse_production/screens/(tabs)/trending.tsx" "app/(os)/pulse/(tabs)/trending.tsx"
cp "pulse_production/screens/(tabs)/topics.tsx" "app/(os)/pulse/(tabs)/topics.tsx"
cp "pulse_production/screens/(tabs)/alerts.tsx" "app/(os)/pulse/(tabs)/alerts.tsx"
cp "pulse_production/screens/(tabs)/discover.tsx" "app/(os)/pulse/(tabs)/discover.tsx"

cp "pulse_production/screens/events.tsx" "app/(os)/pulse/events.tsx"
cp "pulse_production/screens/creators.tsx" "app/(os)/pulse/creators.tsx"
cp "pulse_production/screens/businesses.tsx" "app/(os)/pulse/businesses.tsx"
cp "pulse_production/screens/communities.tsx" "app/(os)/pulse/communities.tsx"
cp "pulse_production/screens/analytics.tsx" "app/(os)/pulse/analytics.tsx"
cp "pulse_production/screens/search.tsx" "app/(os)/pulse/search.tsx"
cp "pulse_production/screens/saved.tsx" "app/(os)/pulse/saved.tsx"

cp pulse_production/components/*.tsx "domains/pulse/components/"

echo 'export { usePulseStore } from "./store";' > "domains/pulse/state/index.ts"
echo 'export { usePulseHome } from "./usePulseHome";' > "domains/pulse/hooks/index.ts"
echo 'export { pulseService } from "./pulseService";' > "domains/pulse/services/index.ts"

echo "=== Install complete ==="
