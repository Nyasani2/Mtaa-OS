MTAA TRIBES MODULE v1.0
=========================

FILE COUNT: 17 files
STRUCTURE:
  sql/tribes_schema.sql
  lib/tribes/manifest.ts
  lib/tribes/types.ts
  lib/tribes/services/tribeService.ts
  lib/tribes/hooks/useTribes.ts
  lib/tribes/components/TribeCard.tsx
  lib/tribes/components/TribeFeed.tsx
  lib/tribes/components/TribeChat.tsx
  lib/tribes/components/TribeEventCard.tsx
  lib/tribes/components/TribeMemberList.tsx
  app/(os)/tribes/_layout.tsx
  app/(os)/tribes/index.tsx
  app/(os)/tribes/[slug].tsx
  app/(os)/tribes/create.tsx
  app/(os)/tribes/events/[id].tsx
  app/(os)/tribes/settings/[slug].tsx

EXTRACTION:
  cd ~/MTAA_OS_V10
  unzip ~/Downloads/mtaa-tribes-v1.zip -d .

SQL:
  Paste sql/tribes_schema.sql into Supabase SQL Editor and run.

REGISTRY:
  In lib/appstore/registry.ts, add:
    import { tribesManifest } from '@/lib/tribes/manifest';
    export const appRegistry = [ ..., tribesManifest ];

ASIS INTEGRATION:
  Tribes AI is wired to report to ASIS via manifest.asisIntegration.
  ASIS handles: content validation, AI generation, moderation, recommendations, search.
  Tribes never calls AI directly — always delegates to ASIS.

SCREENS:
  /tribes           - Directory (search, categories, create FAB)
  /tribes/[slug]    - Detail (feed, chat, events, heritage, members tabs)
  /tribes/create    - Create new tribe
  /tribes/events/[id] - Event detail + RSVP
  /tribes/settings/[slug] - Settings + admin controls + leave
