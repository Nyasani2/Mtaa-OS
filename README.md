# Phase A+B Delivery Package

## Files Included

### Cleanup Script
- cleanup_phase_a.sh — Run this FIRST from project root

### Missing Manifests (8 files)
- lib/mtaa/appstore/apps/documents/manifest.ts
- lib/mtaa/appstore/apps/gallery/manifest.ts
- lib/mtaa/appstore/apps/messages/manifest.ts
- lib/mtaa/appstore/apps/clock/manifest.ts
- lib/mtaa/appstore/apps/scheduler/manifest.ts
- lib/mtaa/appstore/apps/sim/manifest.ts
- lib/mtaa/appstore/apps/recents/manifest.ts
- lib/mtaa/appstore/apps/civic/manifest.ts (unified)

### Civic Courts Routes (9 files)
- app/(os)/civic/courts/index.tsx (enhanced hub)
- app/(os)/civic/courts/cases.tsx
- app/(os)/civic/courts/hearings.tsx
- app/(os)/civic/courts/judgments.tsx
- app/(os)/civic/courts/bails.tsx
- app/(os)/civic/courts/fines.tsx
- app/(os)/civic/courts/appeals.tsx
- app/(os)/civic/courts/jury.tsx
- app/(os)/civic/courts/payroll.tsx

### Civic Prisons Routes (9 files)
- app/(os)/civic/prisons/index.tsx (enhanced hub)
- app/(os)/civic/prisons/inmates.tsx
- app/(os)/civic/prisons/cells.tsx
- app/(os)/civic/prisons/visits.tsx
- app/(os)/civic/prisons/incidents.tsx
- app/(os)/civic/prisons/movements.tsx
- app/(os)/civic/prisons/parole.tsx
- app/(os)/civic/prisons/wardens.tsx
- app/(os)/civic/prisons/payroll.tsx

### Shop OS Routes (6 files)
- app/(os)/shop/index.tsx
- app/(os)/shop/create.tsx
- app/(os)/shop/cart.tsx
- app/(os)/shop/orders.tsx
- app/(os)/shop/marketplace.tsx
- app/(os)/shop/product-detail.tsx

### Scheduler Routes (4 files)
- app/(os)/scheduler/index.tsx (hub)
- app/(os)/scheduler/tasks.tsx
- app/(os)/scheduler/reminders.tsx
- app/(os)/scheduler/events.tsx

### Messages Routes (3 files)
- app/(os)/messages/index.tsx (enhanced inbox)
- app/(os)/messages/compose.tsx
- app/(os)/messages/thread/[id].tsx

### Clock Routes (4 files)
- app/(os)/clock/alarms.tsx
- app/(os)/clock/timer.tsx
- app/(os)/clock/stopwatch.tsx
- app/(os)/clock/world.tsx

## Installation Steps

1. Run cleanup script from project root:
   chmod +x cleanup_phase_a.sh && ./cleanup_phase_a.sh

2. Extract this ZIP into your project root (overwrites existing files):
   unzip -o phase_a_b_delivery.zip

3. Delete the old scheduler.tsx (now replaced by folder):
   rm app/(os)/scheduler.tsx

4. Update app/(os)/appstore/index.tsx to register new manifests

5. Verify build:
   npx expo start --clear

## Total Files: 43 new files + 1 cleanup script = 44 files
