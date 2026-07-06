BATCH 02: Government Module (5 files)
======================================

Files:
1. app/(os)/health/government/index.tsx — Dashboard with stats, alerts, actions
2. app/(os)/health/government/population/index.tsx — Citizen health records, search, add
3. app/(os)/health/government/surveillance/index.tsx — Outbreak reporting, alerts, disease monitoring
4. app/(os)/health/government/verify-facilities/index.tsx — Approve/reject pending hospitals
5. lib/health/hooks/useGovernment.ts — Real Supabase queries, CRUD, search

INSTALL:
========
cd ~/MTAA_OS_V10
# Backup old files
mv "app/(os)/health/government/index.tsx" "app/(os)/health/government/index.tsx.bak"
mv "app/(os)/health/government/population/index.tsx" "app/(os)/health/government/population/index.tsx.bak"
mv "app/(os)/health/government/surveillance/index.tsx" "app/(os)/health/government/surveillance/index.tsx.bak"
mv "app/(os)/health/government/verify-facilities/index.tsx" "app/(os)/health/government/verify-facilities/index.tsx.bak"
mv "lib/health/hooks/useGovernment.ts" "lib/health/hooks/useGovernment.ts.bak" 2>/dev/null || true

# Extract
unzip ~/Downloads/Batch02_Government.zip -d .

# Add to lib/health/hooks/index.ts:
#   export * from "./useGovernment";

DEPENDENCIES:
- Supabase tables: health_facilities, health_alerts, health_outbreaks, health_population
