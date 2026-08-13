#!/bin/bash
set -e
cd ~/MTAA_OS_V10
BACKUP="backups/batch1_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
for f in tsconfig.json lib/mtruck/types.ts lib/profile/types.ts lib/asis-cse/asis-cse-types.ts lib/asis-cse/asis-cse-constants.ts lib/asis-cse/asis-cse-kamos.ts lib/transport/types.ts lib/types/module.types.ts lib/mtaa/appstore/apps/types.ts lib/kernel/index.ts lib/types/database.ts lib/auth/index.ts lib/supabase/index.ts lib/supabase/client.ts lib/calendar/hooks/calendar-service.ts lib/hooks/withTimeout.ts lib/services/wallet-deposit-service.ts lib/health/hooks/usePaginatedQuery.ts lib/health/hooks/useDoctor.ts lib/health/services/doctor.service.ts; do
  [ -f "$f" ] && cp --parents "$f" "$BACKUP" 2>/dev/null || true
done
echo "[1/3] Backups done"
cp batch1/tsconfig.json tsconfig.json
cp batch1/lib/types/database.ts lib/types/database.ts
cp batch1/lib/auth/index.ts lib/auth/index.ts
cp batch1/lib/kernel/index.ts lib/kernel/index.ts
cp batch1/lib/mtaa/appstore/apps/types.ts lib/mtaa/appstore/apps/types.ts
cp batch1/lib/supabase/client.ts lib/supabase/client.ts
cp batch1/lib/supabase/index.ts lib/supabase/index.ts
cp batch1/lib/calendar/hooks/calendar-service.ts lib/calendar/hooks/calendar-service.ts
cp batch1/lib/hooks/withTimeout.ts lib/hooks/withTimeout.ts
cp batch1/lib/services/wallet-deposit-service.ts lib/services/wallet-deposit-service.ts
cp batch1/lib/health/hooks/usePaginatedQuery.ts lib/health/hooks/usePaginatedQuery.ts
cp batch1/lib/health/hooks/useDoctor.ts lib/health/hooks/useDoctor.ts
cp batch1/lib/health/services/doctor.service.ts lib/health/services/doctor.service.ts
echo "[2/3] Overwrites done"
cat batch1/lib/mtruck/camelcase-aliases.ts >> lib/mtruck/types.ts
cat batch1/lib/profile/types-additions.ts >> lib/profile/types.ts
cat batch1/lib/asis-cse/asis-cse-types-additions.ts >> lib/asis-cse/asis-cse-types.ts
cat batch1/lib/asis-cse/asis-cse-constants-additions.ts >> lib/asis-cse/asis-cse-constants.ts
cat batch1/lib/asis-cse/asis-cse-kamos-additions.ts >> lib/asis-cse/asis-cse-kamos.ts
cat batch1/lib/transport/types-additions.ts >> lib/transport/types.ts
cat batch1/lib/types/module.types-additions.ts >> lib/types/module.types.ts
echo "[3/3] Appends done"
echo "Run: npx tsc --noEmit"
