#!/bin/bash
# Remove conflicting type files that duplicate police.types.ts
cd ~/MTAA_OS_V10
rm -f lib/civic/police/types/case.ts
rm -f lib/civic/police/types/evidence.ts
rm -f lib/civic/police/types/incident.ts
rm -f lib/civic/police/types/notification.ts
rm -f lib/civic/police/types/officer.ts
echo "Cleaned up conflicting police type files"
